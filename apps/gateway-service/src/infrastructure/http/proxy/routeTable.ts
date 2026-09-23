import type { Env } from '../../../config/env'

export interface ProxyRoute {
  /** Express mount path, and the public prefix clients call. */
  readonly prefix: `/${string}`
  /** Downstream origin, without a path: see buildApp for why. */
  readonly target: string
}

/**
 * The gateway's entire routing policy, in one place.
 *
 * Mirrors the current compose topology
 */
export function buildRouteTable(env: Env): readonly ProxyRoute[] {
  return [
    { prefix: '/auth', target: env.AUTH_SERVICE_URL },
    { prefix: '/catalog', target: env.CATALOG_SERVICE_URL },
    { prefix: '/recommendation', target: env.RECOMMENDATION_SERVICE_URL },
    { prefix: '/review', target: env.REVIEW_SERVICE_URL },
    { prefix: '/watchlist', target: env.WATCHLIST_SERVICE_URL },
  ]
}
