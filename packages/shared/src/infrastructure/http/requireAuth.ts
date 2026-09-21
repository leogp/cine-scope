import { NextFunction, Request, RequestHandler, Response } from 'express'
import jwt from 'jsonwebtoken'

import { AuthContext } from './authContext'

export interface RequireAuthOptions {
  secret: string
  issuer?: string
}

const BEARER_PREFIX = 'Bearer '

/**
 * Only string arrays survive; a claim of any other shape is treated as absent
 * rather than trusted, so a malformed token can never widen a caller's rights.
 */
const stringArrayClaim = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []

const toAuthContext = (payload: jwt.JwtPayload): AuthContext | null => {
  if (typeof payload.sub !== 'string' || payload.sub.length === 0) {
    return null
  }

  return {
    userId: payload.sub,
    username: typeof payload.username === 'string' ? payload.username : '',
    email: typeof payload.email === 'string' ? payload.email : '',
    roles: stringArrayClaim(payload.roles),
    permissions: stringArrayClaim(payload.permissions),
  }
}

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

    if (!header || !header.startsWith(BEARER_PREFIX)) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    const token = header.slice(BEARER_PREFIX.length).trim()

    let payload: string | jwt.JwtPayload

    try {
      payload = jwt.verify(token, options.secret, { issuer: options.issuer })
    } catch {
      // Signature, expiry and issuer failures are deliberately indistinguishable
      // to the caller — the reason is not theirs to learn.
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    const auth = typeof payload === 'string' ? null : toAuthContext(payload)

    if (!auth) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    req.auth = auth
    next()
  }
}
