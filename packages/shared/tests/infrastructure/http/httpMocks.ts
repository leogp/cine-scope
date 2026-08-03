import { NextFunction, Request, Response } from 'express'

/**
 * Hand-rolled req/res/next doubles. Shared deliberately has no supertest
 * dependency — these middlewares only ever touch a handful of properties,
 * so a real HTTP round-trip would buy nothing.
 */
export interface MockResponse {
  status: jest.Mock
  json: jest.Mock
  sentStatus?: number
  sentBody?: unknown
}

export const createMockRequest = (overrides: Partial<Request> = {}): Request =>
  ({ body: {}, params: {}, query: {}, originalUrl: '/', ...overrides }) as Request

export const createMockResponse = (): MockResponse => {
  const res: MockResponse = {
    status: jest.fn(),
    json: jest.fn(),
  }

  res.status.mockImplementation((code: number) => {
    res.sentStatus = code
    return res
  })

  res.json.mockImplementation((payload: unknown) => {
    res.sentBody = payload
    return res
  })

  return res
}

export const asResponse = (res: MockResponse): Response => res as unknown as Response

export const createMockNext = (): jest.MockedFunction<NextFunction> => jest.fn()

// asyncHandler returns synchronously, so awaiting it does not await the
// handler it wrapped — drain the microtask queue instead.
export const flushPromises = (): Promise<void> =>
  new Promise((resolve) => {
    setImmediate(resolve)
  })
