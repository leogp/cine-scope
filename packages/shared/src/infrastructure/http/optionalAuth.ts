import { NextFunction, Request, RequestHandler, Response } from 'express'

import { AccessTokenOptions, verifyBearerHeader } from './bearerToken'

export type OptionalAuthOptions = AccessTokenOptions

/**
 * Identifies the caller when they present a token, and lets callers who
 * present none through as anonymous (no `req.auth`). Meant for an edge that
 * must know *who* is calling before later middleware decides, route by route,
 * whether anyone has to be.
 *
 * Only a request with no `Authorization` header at all is anonymous. A header
 * that is present but proves nothing — wrong scheme, malformed, bad signature,
 * expired, foreign issuer, no subject — is a 401, never a silent downgrade to
 * anonymous: a client whose token broke must find out, and a forged token must
 * not quietly buy the public view of a route. As with `requireAuth`, the 401
 * does not say which check failed.
 */
export function buildOptionalAuth(options: OptionalAuthOptions): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const header = req.headers.authorization

    if (header === undefined) {
      next()
      return
    }

    const auth = verifyBearerHeader(header, options)

    if (!auth) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    req.auth = auth
    next()
  }
}
