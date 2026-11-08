/**
 * The catalog collections, each mounted by catalog-service at `/<name>` (its
 * http/app.ts). Each has its own generation counter (buildResponseCache.ts).
 */
export const COLLECTIONS = ['movies', 'series', 'people', 'genres', 'companies'] as const

export type Collection = (typeof COLLECTIONS)[number]

/**
 * How catalog's query schema coerces a parameter, which is how the cache keys
 * its value (cacheKeys.ts). `number`: `z.coerce.number()`.
 */
export type QueryParamKind = 'number'

export interface CacheableRoute {
  /**
   * An Express route path under CACHE_PREFIX: the path catalog itself sees.
   * Literal segments and `:param`s only. Matched like the access policy:
   * case-insensitive, trailing slash optional.
   */
  readonly path: `/${string}`
  readonly collection: Collection
  /** Every query parameter catalog reads on this route; any other is left out of the key. */
  readonly query: Readonly<Record<string, QueryParamKind>>
}

/** The only proxied prefix whose responses are ever cached. */
export const CACHE_PREFIX = '/catalog'

/** catalog's `paginationQuerySchema`. */
const PAGINATION = { page: 'number', pageSize: 'number' } as const

/**
 * Public catalog reads the gateway may answer from its shared cache. GET only:
 * HEAD always reaches catalog. A read missing here is never cached, so a route
 * catalog adds stays uncached until it is listed with its query parameters.
 * Listed in catalog's own mounting order: the first match decides, as in catalog.
 *
 * Shared between callers because no catalog GET handler reads `req.auth`: the
 * same request gets the same response whoever sends it. A read that starts to
 * depend on the caller must leave this table.
 *
 * /catalog/health is deliberately absent: a cached health check would report a
 * catalog that is down as up.
 *
 * Invalidation dependency rule. A 2xx write anywhere under `/<collection>`
 * bumps that collection's generation and no other. Collections are invalidated
 * independently because movie and series payloads embed genres, people and
 * companies, and those three have no update or delete today: they can only be
 * created, and a new one appears in no payload already cached. If any of them
 * gains an update or a delete, its writes must also invalidate every
 * collection that embeds it (movies and series), or those payloads keep the
 * old copy until their TTL.
 */
export const CACHEABLE_ROUTES: readonly CacheableRoute[] = [
  { path: '/movies', collection: 'movies', query: PAGINATION },
  { path: '/movies/:id', collection: 'movies', query: {} },
  { path: '/series/:id', collection: 'series', query: {} },
  { path: '/genres/:id', collection: 'genres', query: {} },
  { path: '/companies/:id', collection: 'companies', query: {} },
  { path: '/people/:id', collection: 'people', query: {} },
]
