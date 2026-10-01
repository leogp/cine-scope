import { NextFunction, Request, RequestHandler, Response } from 'express'

import { AccessTokenOptions, verifyBearerHeader } from './bearerToken'

export type RequireAuthOptions = AccessTokenOptions

/**
 * Verifies the `Authorization: Bearer <token>` access token and populates
 * `req.auth`. Pair it with `requirePermission` — this middleware establishes
 * *who* the caller is and says nothing about what they may do.
 *
 * Answers 401 inline rather than delegating to `next(err)`, matching
 * `validateRequest`: the response is fixed, so no service needs to teach its
 * error handler about an auth error type.
 */
export function buildRequireAuth(options: RequireAuthOptions): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const header = req.headers.authorization
    // An empty header is as absent as a missing one: both are a 401 here.
    const auth = header ? verifyBearerHeader(header, options) : null

    if (!auth) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    req.auth = auth
    next()
  }
}
