import { buildHealthRoutes, notFoundHandler } from '@cinescope/shared/infrastructure/http'
import express, { Application } from 'express'

import { errorHandler } from './middlewares/errorHandler'
import { stripForwardedHeaders } from './middlewares/stripForwardedHeaders'
import { createServiceProxy } from './proxy/createServiceProxy'
import type { ProxyRoute } from './proxy/routeTable'

export interface GatewayAppConfig {
  readonly routes: readonly ProxyRoute[]
  readonly proxyTimeoutMs: number
}

/**
 * Mounting order is the contract here, so it is spelled out step by step.
 *
 * There is deliberately no app-level `express.json()`. A body parser consumes
 * the request stream, and the proxy would then forward a request whose body
 * never arrives — the upstream waits for bytes that were already read, and the
 * call hangs until the timeout. Gateway-only routes that need JSON get their own
 * parser (step 5).
 */
export const buildApp = ({ routes, proxyTimeoutMs }: GatewayAppConfig): Application => {
  const app = express()

  // 1. Do not advertise the stack.
  app.disable('x-powered-by')

  // 2. Untrusted forwarding headers are dropped before `xfwd` writes real ones.
  app.use(stripForwardedHeaders)

  // 3. The gateway's own liveness, answered without touching any service.
  app.use(buildHealthRoutes('gateway-service'))

  // 4. Reserved: authentication (gateway/auth) then authorization
  //    (gateway/authorization) mount here — after health, before the proxies.

  // 5. The proxies. Express strips `route.prefix` from req.url before the
  //    handler runs, which is what turns /catalog/movies into /movies.
  for (const route of routes) {
    app.use(route.prefix, createServiceProxy({ route, timeoutMs: proxyTimeoutMs }))
  }

  // 6. Reserved: gateway-only routes (composition endpoints), each with a
  //    locally scoped parser and a prefix that overlaps no proxy prefix:
  //      app.use('/compose', express.json(), buildComposeRoutes(...))

  // 7. Anything unmatched — `/`, `/engagement`, `/catalogue` — is a gateway 404.
  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
