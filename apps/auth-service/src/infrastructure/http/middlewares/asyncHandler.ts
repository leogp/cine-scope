import { NextFunction, Request, RequestHandler, Response } from 'express'

// Express 4 does not forward rejected promises to error middleware
export const asyncHandler =
  (fn: RequestHandler): RequestHandler =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
