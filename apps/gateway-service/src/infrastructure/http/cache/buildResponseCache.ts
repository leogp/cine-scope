import {
  Router,
  type NextFunction,
  type Request,
  type RequestHandler,
  type Response,
} from 'express'

import {
  CACHEABLE_ROUTES,
  CACHE_PREFIX,
  COLLECTIONS,
  type CacheableRoute,
  type Collection,
} from './cacheableRoutes'
import { cacheKeys, resourceOf, type CacheKeys } from './cacheKeys'
import type { CachedResponse, ResponseCacheStore } from './responseCacheStore'
import { onResponseHead, teeResponse } from './teeResponse'

export interface ResponseCacheConfig {
  readonly store: ResponseCacheStore
  /** Upper bound on staleness: how long an entry a write failed to invalidate survives. */
  readonly ttlMs: number
  /** Largest body stored, in bytes; a larger one is served and forgotten. */
  readonly maxEntryBytes: number
  /** Namespaces every key. Replicas share a cache only if they share the prefix. */
  readonly keyPrefix?: string
}

export const DEFAULT_KEY_PREFIX = 'cache:'

const X_CACHE = 'X-Cache'

type Lookup =
  | { readonly outcome: 'hit'; readonly entry: CachedResponse }
  | { readonly outcome: 'miss'; readonly entryKey: string }
  /** Not looked up (unkeyable request) or the store failed: a miss that stores nothing. */
  | { readonly outcome: 'bypass' }

const BYPASS: Lookup = { outcome: 'bypass' }

/**
 * Store and INCR failures are not logged here: the store's owner reports Redis
 * availability on state transitions (infrastructure/redis/redisAvailability.ts).
 */
const ignore = (): void => undefined

/**
 * The gateway's shared response cache, for the public catalog reads in
 * CACHEABLE_ROUTES. Not keyed by caller: no cached route depends on one.
 *
 * Generations. Each collection has a counter, `<prefix>gen:<collection>`: a
 * missing one reads as 0, and none expires (there are five). Every entry key
 * embeds the value read at lookup, and the entry is stored under that same key,
 * so an INCR orphans every entry of the collection at once, on every replica;
 * the orphans expire with their TTL.
 * - Residual race: for about one Redis round trip after a write is answered, a
 *   read that fetched the generation just before the INCR landed is served the
 *   previous entry.
 * - Reverse race, harmless: a miss that fetched the old generation, then got the
 *   old payload from catalog, stores it under the old generation's key, which no
 *   lookup reads any more.
 * - A failed INCR invalidates nothing: the collection's entries stay stale until
 *   their TTL.
 *
 * Round trips. A hit costs two sequential GETs: the generation, then the entry.
 * A Lua script could fold them into one, but it would read a key it cannot
 * declare in KEYS (the entry key depends on the generation it reads), which
 * Redis Cluster forbids, and it would bring script loading and NOSCRIPT recovery
 * to the shared client. A second sub-millisecond GET is cheap next to the proxy
 * hop, catalog and Postgres it replaces. A miss adds one SET, never awaited.
 *
 * Stored: status, body and Content-Type, and only when storableContentType
 * agrees. Captured at the response (teeResponse.ts), so the proxy is unchanged.
 *
 * Fail open: a lookup that errors or times out (REDIS_COMMAND_TIMEOUT_MS per
 * command) is a miss that stores nothing; store and INCR errors are swallowed.
 *
 * Known limitation, no stampede protection: concurrent misses on one key all
 * reach catalog and all store the same payload; the last SET wins.
 */
export function buildResponseCache(config: ResponseCacheConfig): RequestHandler {
  const keys = cacheKeys(config.keyPrefix ?? DEFAULT_KEY_PREFIX)
  const catalog = Router()

  // Reads first: a matched read leaves with next('router'), so the first match
  // decides, as it does in catalog.
  for (const route of CACHEABLE_ROUTES) {
    catalog.get(route.path, buildRead(route, keys, config))
  }
  for (const collection of COLLECTIONS) {
    catalog.use(`/${collection}`, buildInvalidation(collection, keys, config.store))
  }

  const cache = Router()
  cache.use(CACHE_PREFIX, catalog)
  return cache
}

function buildRead(
  route: CacheableRoute,
  keys: CacheKeys,
  config: ResponseCacheConfig
): RequestHandler {
  return (req, res, next) => {
    // Express runs GET handlers for HEAD too; HEAD is never cached and passes through.
    if (req.method !== 'GET') return next('router')
    serveRead(route, keys, config, req, res, next).catch(next)
  }
}

async function serveRead(
  route: CacheableRoute,
  keys: CacheKeys,
  { store, ttlMs, maxEntryBytes }: ResponseCacheConfig,
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const resource = resourceOf(route, req)
  const lookup =
    resource === undefined ? BYPASS : await lookUp(store, keys, route.collection, resource)

  if (lookup.outcome === 'hit') {
    const { status, contentType, body } = lookup.entry
    res.setHeader(X_CACHE, 'HIT')
    // setHeader, not res.type()/res.set(), which would append a charset the
    // service never sent. send() computes Content-Length from the body.
    res.setHeader('Content-Type', contentType)
    res.status(status).send(body)
    return
  }

  res.setHeader(X_CACHE, 'MISS')
  if (lookup.outcome === 'miss') {
    storeOnceSent(res, lookup.entryKey, store, ttlMs, maxEntryBytes)
  }
  next('router')
}

/** Never rejects: any failure is a bypass, since the generation to store under is unknown. */
async function lookUp(
  store: ResponseCacheStore,
  keys: CacheKeys,
  collection: Collection,
  resource: string
): Promise<Lookup> {
  try {
    const generation = await store.getGeneration(keys.generation(collection))
    const entryKey = keys.entry(collection, generation, resource)
    const entry = await store.getEntry(entryKey)
    return entry ? { outcome: 'hit', entry } : { outcome: 'miss', entryKey }
  } catch {
    return BYPASS
  }
}

/** Tees the proxied response and stores it, unawaited, once `end` has run. */
function storeOnceSent(
  res: Response,
  entryKey: string,
  store: ResponseCacheStore,
  ttlMs: number,
  maxEntryBytes: number
): void {
  let contentType: string | undefined
  let declaredLength: number | undefined

  teeResponse(res, {
    maxBytes: maxEntryBytes,
    accept: () => {
      contentType = storableContentType(res, maxEntryBytes)
      declaredLength = contentLengthOf(res)
      return contentType !== undefined
    },
    onComplete: (body) => {
      // A body shorter than its Content-Length was cut off on the way.
      if (contentType === undefined) return
      if (declaredLength !== undefined && body.length !== declaredLength) return

      store.setEntry(entryKey, { status: res.statusCode, contentType, body }, ttlMs).catch(ignore)
    },
  })
}

/**
 * The Content-Type to store the response with, or undefined when it must not
 * be stored. Read once the head is final, before any body byte is buffered.
 */
function storableContentType(res: Response, maxBytes: number): string | undefined {
  // Also rules out the proxy error handler's 502.
  if (res.statusCode !== 200) return undefined
  if (res.getHeader('Content-Encoding') !== undefined) return undefined
  if (forbidsSharedCaching(res.getHeader('Cache-Control'))) return undefined

  const length = contentLengthOf(res)
  if (length !== undefined && length > maxBytes) return undefined

  // Required: send() would replay a missing type as application/octet-stream.
  const type = res.getHeader('Content-Type')
  return typeof type === 'string' ? type : undefined
}

function forbidsSharedCaching(header: number | string | string[] | undefined): boolean {
  if (header === undefined) return false

  const directives = [header]
    .flat()
    .join(',')
    .split(',')
    .map((directive) => directive.split('=')[0].trim().toLowerCase())

  return directives.includes('no-store') || directives.includes('private')
}

function contentLengthOf(res: Response): number | undefined {
  const header = res.getHeader('Content-Length')
  if (header === undefined) return undefined

  const length = Number(header)
  return Number.isSafeInteger(length) && length >= 0 ? length : undefined
}

/**
 * A write under the collection (any method but GET and HEAD) bumps its
 * generation once the service has answered 2xx: at writeHead, which runs when
 * the proxy relays the service's status line, so never before the service
 * has committed, and before the response is flushed. Not awaited, so it never
 * delays the response. A 4xx or 5xx changed nothing and invalidates nothing.
 */
function buildInvalidation(
  collection: Collection,
  keys: CacheKeys,
  store: ResponseCacheStore
): RequestHandler {
  const generationKey = keys.generation(collection)

  return (req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      onResponseHead(res, () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          store.incrementGeneration(generationKey).catch(ignore)
        }
      })
    }
    next()
  }
}
