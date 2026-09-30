import 'dotenv/config'
import { env } from './config/env'
import { buildApp } from './infrastructure/http/app'
import { buildRouteTable } from './infrastructure/http/proxy/routeTable'

const app = buildApp({
  routes: buildRouteTable(env),
  proxyTimeoutMs: env.PROXY_TIMEOUT_MS,
})

app.listen(env.PORT, () => console.log(`gateway-service running on port ${env.PORT}`))
