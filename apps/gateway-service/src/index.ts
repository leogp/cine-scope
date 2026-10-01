import 'dotenv/config'
import { buildOptionalAuth } from '@cinescope/shared/infrastructure/http'
import { env } from './config/env'
import { buildApp } from './infrastructure/http/app'
import { buildRouteTable } from './infrastructure/http/proxy/routeTable'

const app = buildApp({
  routes: buildRouteTable(env),
  proxyTimeoutMs: env.PROXY_TIMEOUT_MS,
  // Issuer pinned, as in catalog-service: a token minted by any other service in
  // the platform cannot stand in for one from auth-service.
  authenticate: buildOptionalAuth({ secret: env.JWT_ACCESS_SECRET, issuer: 'auth-service' }),
})

app.listen(env.PORT, () => console.log(`gateway-service running on port ${env.PORT}`))
