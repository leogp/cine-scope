import { NextFunction, Request, RequestHandler, Response } from 'express'

/**
 * Guards a route behind a named permission, e.g. `catalog:write`. Expects
 * `requireAuth` earlier in the chain to have populated `req.auth`.
 *
 * A missing `req.auth` is a 401, not a 403: the chain is misconfigured or the
 * caller is anonymous, and in neither case has a permission been denied.
 */
export function requirePermission(permission: string): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.auth) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    if (!req.auth.permissions.includes(permission)) {
      res.status(403).json({ error: 'Forbidden' })
      return
    }

    next()
  }
}
