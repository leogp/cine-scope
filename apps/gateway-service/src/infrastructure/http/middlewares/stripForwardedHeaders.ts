import type { RequestHandler } from 'express'

const FORWARDED_HEADERS = [
  'forwarded',
  'x-forwarded-for',
  'x-forwarded-host',
  'x-forwarded-port',
  'x-forwarded-proto',
] as const

/**
 * `xfwd` *appends* to whatever the client sent, so without this a caller could
 * prepend any IP it likes to X-Forwarded-For and a downstream service reading
 * the left-most entry would believe it.
 *
 * The gateway is the edge today (compose publishes 4000 directly). If a real
 * load balancer is ever put in front, drop this and configure `trust proxy`
 * with that balancer's address instead — that is the moment these headers stop
 * being untrusted input.
 */
export const stripForwardedHeaders: RequestHandler = (req, _res, next) => {
  for (const header of FORWARDED_HEADERS) {
    delete req.headers[header]
  }

  next()
}
