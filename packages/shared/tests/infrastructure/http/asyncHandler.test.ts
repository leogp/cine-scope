import { RequestHandler } from 'express'

import { asyncHandler } from '../../../src/infrastructure/http/asyncHandler'
import {
  asResponse,
  createMockNext,
  createMockRequest,
  createMockResponse,
  flushPromises,
} from './httpMocks'

describe('asyncHandler', () => {
  it('passes the request, response and next through to the wrapped handler', async () => {
    const handler = jest.fn().mockResolvedValue(undefined) as unknown as RequestHandler
    const req = createMockRequest()
    const res = asResponse(createMockResponse())
    const next = createMockNext()

    asyncHandler(handler)(req, res, next)
    await flushPromises()

    expect(handler).toHaveBeenCalledWith(req, res, next)
  })

  it('does not call next when the handler resolves', async () => {
    const next = createMockNext()

    asyncHandler(jest.fn().mockResolvedValue(undefined) as unknown as RequestHandler)(
      createMockRequest(),
      asResponse(createMockResponse()),
      next
    )
    await flushPromises()

    expect(next).not.toHaveBeenCalled()
  })

  it('forwards a rejected promise to next', async () => {
    const error = new Error('boom')
    const next = createMockNext()

    asyncHandler(jest.fn().mockRejectedValue(error) as unknown as RequestHandler)(
      createMockRequest(),
      asResponse(createMockResponse()),
      next
    )
    await flushPromises()

    expect(next).toHaveBeenCalledWith(error)
  })

  it('tolerates a handler that returns a plain value instead of a promise', async () => {
    const next = createMockNext()
    const handler = jest.fn().mockReturnValue(undefined) as unknown as RequestHandler

    expect(() =>
      asyncHandler(handler)(createMockRequest(), asResponse(createMockResponse()), next)
    ).not.toThrow()
    await flushPromises()

    expect(next).not.toHaveBeenCalled()
  })
})
