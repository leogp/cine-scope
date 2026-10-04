import 'dotenv/config'
import { buildOptionalAuth } from '@cinescope/shared/infrastructure/http'
import { env } from './config/env'
import { buildApp } from './infrastructure/http/app'
import { ACCESS_POLICY } from './infrastructure/http/authorization/accessPolicy'
import { buildAuthorization } from './infrastructure/http/authorization/buildAuthorization'
import { buildRouteTable } from './infrastructure/http/proxy/routeTable'

const routes = buildRouteTable(env)

const app = buildApp({
  routes,
  proxyTimeoutMs: env.PROXY_TIMEOUT_MS,
  // Issuer pinned, as in catalog-service: a token minted by any other service in
  // the platform cannot stand in for one from auth-service.
  authenticate: buildOptionalAuth({ secret: env.JWT_ACCESS_SECRET, issuer: 'auth-service' }),
  // Throws at startup if the policy names a prefix the route table lacks.
  authorize: buildAuthorization({ policy: ACCESS_POLICY, routes }),
})

app.listen(env.PORT, () => console.log(`gateway-service running on port ${env.PORT}`))
