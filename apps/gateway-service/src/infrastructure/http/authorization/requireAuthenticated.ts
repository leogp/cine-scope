import type { NextFunction, Request, Response } from 'express'

/**
 * The `authenticated` access level: any identified caller, whatever their
 * permissions. It only reads the `req.auth` that `authenticate` derived from a
 * verified token; `buildRequireAuth` would verify the token a second time.
 */
export function requireAuthenticated(req: Request, res: Response, next: NextFunction): void {
  if (!req.auth) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  next()
}
