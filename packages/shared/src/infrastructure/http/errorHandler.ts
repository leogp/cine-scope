import { ErrorRequestHandler, NextFunction, Request, Response } from 'express'

// Each service owns its error→status policy; shared owns only the
// response envelope and the 500 fallback for unmapped errors.
export type StatusResolver = (err: Error) => number | undefined

export function buildErrorHandler(statusFor: StatusResolver): ErrorRequestHandler {
  return function errorHandler(
    err: Error,
    _req: Request,
    res: Response,
    _next: NextFunction
  ): void {
    const status = statusFor(err)

    if (status) {
      res.status(status).json({ error: err.constructor.name, message: err.message })
      return
    }

    console.error(err)
    res.status(500).json({ error: 'InternalServerError' })
  }
}
