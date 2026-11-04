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
   * Counts the request against the rate-limit tiers and answers 429 once a
   * quota is spent. Built in the composition root, like `authenticate`, so the
   * Redis client never reaches the HTTP layer and the suites can inject an
   * in-memory store or a pass-through.
   */
  readonly rateLimit: RequestHandler
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
 * parser (step 8).
 */
export const buildApp = ({
  routes,
  proxyTimeoutMs,
  authenticate,
  rateLimit,
  authorize,
}: GatewayAppConfig): Application => {
  const app = express()

  // 1. Do not advertise the stack.
  app.disable('x-powered-by')

  // 2. Untrusted forwarding headers are dropped before `xfwd` writes real ones.
  //    With `trust proxy` off, this also leaves the socket address as `req.ip`:
  //    the only client address the rate limiter (step 5) can trust.
  app.use(stripForwardedHeaders)

  // 3. The gateway's own liveness, answered without touching any service.
  //    Ahead of the rate limiter, so probes are never limited.
  app.use(buildHealthRoutes('gateway-service'))

  // 4. Authentication. `authenticate` identifies the caller: no token passes as
  //    anonymous, a present but unusable token is a 401. `req.auth` is
  //    gateway-local: services keep verifying the forwarded token and enforcing
  //    their own guards.
  //    CORS, when added, mounts before this step: preflight OPTIONS requests
  //    carry no credentials, would be counted by step 5 and refused by step 6.
  app.use(authenticate)

  // 5. Rate limiting, exactly between authentication and authorization.
  //    After `authenticate`, because the global tier keys an identified caller
  //    by `req.auth` (user:<id>) and everyone else by IP; any earlier and every
  //    user behind one address would share a quota.
  //    Before `authorize`, because a request headed for a 401 or 403 must still
  //    count; otherwise probing routes the caller may not use would be free.
  //    The credentials tier adds a stricter, IP-keyed quota on login and signup.
  //    Fails open: a Redis outage lets traffic through unlimited.
  //    Not rate limited: requests `authenticate` rejects (an unusable token)
  //    never get here. Accepted because that rejection is a local signature
  //    check, with no downstream call and no state, so a flood of bad tokens
  //    costs the gateway little and cannot succeed: forging an access token
  //    takes the signing secret, not more attempts. Counting them would take a
  //    separate, IP-keyed tier ahead of authentication.
  app.use(rateLimit)

  // 6. Authorization. `authorize` applies the access policy under each proxied
  //    prefix (public, authenticated or a named permission, failing closed to
  //    authenticated) and answers 401/403 before any service is called.
  app.use(authorize)

  // 7. The proxies, reached only by requests steps 4–6 let through. Express
  //    strips `route.prefix` from req.url before the handler runs, which is
  //    what turns /catalog/movies into /movies.
  for (const route of routes) {
    app.use(route.prefix, createServiceProxy({ route, timeoutMs: proxyTimeoutMs }))
  }

  // 8. Reserved: gateway-only routes (composition endpoints), each with a
  //    locally scoped parser, a prefix that overlaps no proxy prefix and its
  //    own access check, since `authorize` guards proxied prefixes only:
  //      app.use('/compose', express.json(), buildComposeRoutes(...))

  // 9. Anything unmatched — `/`, `/engagement`, `/catalogue` — is a gateway 404;
  //    authorization never touched it, but the rate limiter counted it.
  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
