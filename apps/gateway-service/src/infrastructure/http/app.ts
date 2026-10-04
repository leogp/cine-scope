import { buildHealthRoutes, notFoundHandler } from '@cinescope/shared/infrastructure/http'
import express, { Application, RequestHandler } from 'express'

import { errorHandler } from './middlewares/errorHandler'
import { stripForwardedHeaders } from './middlewares/stripForwardedHeaders'
import { createServiceProxy } from './proxy/createServiceProxy'
import type { ProxyRoute } from './proxy/routeTable'

export interface GatewayAppConfig {
  readonly routes: readonly ProxyRoute[]
  readonly proxyTimeoutMs: number
  /**
   * Identifies the caller (sets `req.auth`) without gating anything. Built in
   * the composition root so the JWT secret never reaches the HTTP layer.
   */
  readonly authenticate: RequestHandler
  /**
   * Applies the access policy to the identified caller before any service is
   * called. Built in the composition root, like `authenticate`, so the policy
   * stays out of the HTTP layer and the suites can inject a pass-through.
   */
  readonly authorize: RequestHandler
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
export const buildApp = ({
  routes,
  proxyTimeoutMs,
  authenticate,
  authorize,
}: GatewayAppConfig): Application => {
  const app = express()

  // 1. Do not advertise the stack.
  app.disable('x-powered-by')

  // 2. Untrusted forwarding headers are dropped before `xfwd` writes real ones.
  app.use(stripForwardedHeaders)

  // 3. The gateway's own liveness, answered without touching any service.
  app.use(buildHealthRoutes('gateway-service'))

  // 4. Authentication, then authorization. `authenticate` identifies the caller:
  //    no token passes as anonymous, a present but unusable token is a 401.
  //    `authorize` then applies the access policy under each proxied prefix
  //    (public, authenticated or a named permission, failing closed to
  //    authenticated) and answers 401/403 before any service is called.
  //    `req.auth` is gateway-local: services keep verifying the forwarded token
  //    and enforcing their own guards.
  //    CORS, when added, mounts before this step: preflight OPTIONS requests
  //    carry no credentials and would be refused here.
  app.use(authenticate)
  app.use(authorize)

  // 5. The proxies, reached only by requests step 4 let through. Express strips `route.prefix` from req.url before the
  //    handler runs, which is what turns /catalog/movies into /movies.
  for (const route of routes) {
    app.use(route.prefix, createServiceProxy({ route, timeoutMs: proxyTimeoutMs }))
  }

  // 6. Reserved: gateway-only routes (composition endpoints), each with a
  //    locally scoped parser, a prefix that overlaps no proxy prefix and its
  //    own access check, since `authorize` guards proxied prefixes only:
  //      app.use('/compose', express.json(), buildComposeRoutes(...))

  // 7. Anything unmatched — `/`, `/engagement`, `/catalogue` — is a gateway 404;
  //    authorization never touched it.
  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
