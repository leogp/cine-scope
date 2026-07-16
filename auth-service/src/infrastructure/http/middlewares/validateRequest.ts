import { NextFunction, Request, RequestHandler, Response } from 'express'
import { ZodType } from 'zod'

export function validateBody(schema: ZodType): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body)

    if (!result.success) {
      res.status(400).json({ error: 'ValidationError', details: result.error.issues })
      return
    }

    req.body = result.data
    next()
  }
}
