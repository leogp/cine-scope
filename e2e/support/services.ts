/**
 * Every prefix the gateway proxies, with the name its service reports on
 * /health. Mirrors the gateway's route table
 * (apps/gateway-service/src/infrastructure/http/proxy/routeTable.ts) and the
 * services in docker-compose.yml.
 */
export const PROXIED_SERVICES = [
  { prefix: '/auth', service: 'auth-service' },
  { prefix: '/catalog', service: 'catalog-service' },
  { prefix: '/recommendation', service: 'recommendation-service' },
  { prefix: '/review', service: 'review-service' },
  { prefix: '/watchlist', service: 'watchlist-service' },
] as const
