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

export function validateParams(schema: ZodType): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.params)

    if (!result.success) {
      res.status(400).json({ error: 'ValidationError', details: result.error.issues })
      return
    }

    req.params = result.data as Request['params']
    next()
  }
}

// req.query is writable on Express 4; becomes getter-only on Express 5
export function validateQuery(schema: ZodType): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query)

    if (!result.success) {
      res.status(400).json({ error: 'ValidationError', details: result.error.issues })
      return
    }

    req.query = result.data as Request['query']
    next()
  }
}
