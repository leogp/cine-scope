import { Request } from 'express'
import { z } from 'zod'

import {
  validateBody,
  validateParams,
  validateQuery,
} from '../../../src/infrastructure/http/validateRequest'
import { asResponse, createMockNext, createMockRequest, createMockResponse } from './httpMocks'

const bodySchema = z.object({ name: z.string().min(1) })
const paramsSchema = z.object({ id: z.string().min(1) })
const querySchema = z.object({ page: z.coerce.number().optional() })

describe('validateBody', () => {
  it('calls next and replaces req.body with the parsed data', () => {
    const req = createMockRequest({ body: { name: 'Drama', extra: 'stripped' } })
    const next = createMockNext()

    validateBody(bodySchema)(req, asResponse(createMockResponse()), next)

    expect(next).toHaveBeenCalledWith()
    expect(req.body).toEqual({ name: 'Drama' })
  })

  it('responds 400 with the zod issues and stops the chain', () => {
    const req = createMockRequest({ body: { name: '' } })
    const res = createMockResponse()
    const next = createMockNext()

    validateBody(bodySchema)(req, asResponse(res), next)

    expect(res.sentStatus).toBe(400)
    expect(res.sentBody).toEqual({
      error: 'ValidationError',
      details: expect.arrayContaining([expect.objectContaining({ path: ['name'] })]),
    })
    expect(next).not.toHaveBeenCalled()
  })
})

describe('validateParams', () => {
  it('calls next and replaces req.params with the parsed data', () => {
    const req = createMockRequest({ params: { id: 'movie-1' } })
    const next = createMockNext()

    validateParams(paramsSchema)(req, asResponse(createMockResponse()), next)

    expect(next).toHaveBeenCalledWith()
    expect(req.params).toEqual({ id: 'movie-1' })
  })

  it('responds 400 for params that fail the schema', () => {
    const res = createMockResponse()
    const next = createMockNext()

    validateParams(paramsSchema)(createMockRequest({ params: {} }), asResponse(res), next)

    expect(res.sentStatus).toBe(400)
    expect(res.sentBody).toMatchObject({ error: 'ValidationError' })
    expect(next).not.toHaveBeenCalled()
  })
})

describe('validateQuery', () => {
  // The coercion is the point: query params always arrive as strings, and
  // downstream code reads them as the schema's output type.
  it('calls next and replaces req.query with the coerced data', () => {
    const req = createMockRequest({ query: { page: '2' } as unknown as Request['query'] })
    const next = createMockNext()

    validateQuery(querySchema)(req, asResponse(createMockResponse()), next)

    expect(next).toHaveBeenCalledWith()
    expect(req.query).toEqual({ page: 2 })
  })

  it('responds 400 for a query param that cannot be coerced', () => {
    const res = createMockResponse()
    const next = createMockNext()

    validateQuery(querySchema)(
      createMockRequest({ query: { page: 'abc' } as unknown as Request['query'] }),
      asResponse(res),
      next
    )

    expect(res.sentStatus).toBe(400)
    expect(res.sentBody).toMatchObject({ error: 'ValidationError' })
    expect(next).not.toHaveBeenCalled()
  })
})
