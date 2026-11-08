import type { Request } from 'express'

import {
  CACHE_PREFIX,
  type CacheableRoute,
  type Collection,
  type QueryParamKind,
} from './cacheableRoutes'

/**
 * Version of the stored entry format, part of every entry key: bumping it
 * leaves the old entries unread, so replicas running two formats side by side
 * never decode each other's.
 */
const ENTRY_FORMAT = 'v1'

export interface CacheKeys {
  /** `<prefix>gen:<collection>`: the collection's generation counter. */
  readonly generation: (collection: Collection) => string
  /** `<prefix>v1:<collection>:<generation>:<resource>`. */
  readonly entry: (collection: Collection, generation: number, resource: string) => string
}

export function cacheKeys(prefix: string): CacheKeys {
  return {
    generation: (collection) => `${prefix}gen:${collection}`,
    entry: (collection, generation, resource) =>
      `${prefix}${ENTRY_FORMAT}:${collection}:${generation}:${resource}`,
  }
}

const PARAMETER = /:(\w+)/g

/** Each kind as catalog's schema coerces it; undefined where catalog would answer 400. */
const NORMALIZE: Readonly<Record<QueryParamKind, (raw: string) => string | undefined>> = {
  // z.coerce.number() is Number(raw), finite only: `02`, `2.0` and ` 2 ` reach
  // catalog as the same 2, so they share a key.
  number: (raw) => {
    const value = Number(raw)
    return Number.isFinite(value) ? String(value) : undefined
  },
}

/**
 * `GET:<path>[?<query>]`, the part of the entry key that names the response, or
 * undefined when the request cannot be keyed safely and so is not cached.
 *
 * - Path: the table's literal segments, each `:param` replaced by its
 *   percent-encoded value. `/catalog/MOVIES/42/` and `/catalog/movies/42` are
 *   one route to catalog (case-insensitive, trailing slash optional), so they
 *   share one key.
 * - Query: only the parameters the route accepts, sorted by name, each value
 *   normalized as catalog coerces it. Others are dropped: catalog's schema
 *   strips them, so they cannot change the response, and keying them would let
 *   any client mint keys in a Redis the rate limiter also depends on.
 *
 * `req.query` is parsed by the gateway's Express exactly as catalog's parses
 * it (both Express 4, default `extended` parser). A parameter parsed into an
 * array (`?page=1&page=2`) or an object (`?page[x]=1`) is not keyed: what
 * catalog makes of it is not the cache's call.
 */
export function resourceOf(route: CacheableRoute, req: Request): string | undefined {
  const query = normalizedQuery(route.query, req.query)
  if (query === undefined) return undefined

  const path =
    CACHE_PREFIX +
    route.path.replace(PARAMETER, (_match, name: string) => encodeURIComponent(req.params[name]))

  return query === '' ? `GET:${path}` : `GET:${path}?${query}`
}

function normalizedQuery(
  accepted: CacheableRoute['query'],
  query: Request['query']
): string | undefined {
  const pairs: string[] = []

  for (const name of Object.keys(accepted).sort()) {
    const raw = query[name]
    if (raw === undefined) continue
    if (typeof raw !== 'string') return undefined

    const value = NORMALIZE[accepted[name]](raw)
    if (value === undefined) return undefined
    pairs.push(`${name}=${value}`)
  }

  return pairs.join('&')
}
