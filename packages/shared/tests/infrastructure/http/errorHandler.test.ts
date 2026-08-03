import { buildErrorHandler } from '../../../src/infrastructure/http/errorHandler'
import { asResponse, createMockNext, createMockRequest, createMockResponse } from './httpMocks'

class NotFoundError extends Error {}
class ConflictError extends Error {}

const statusFor = (err: Error): number | undefined => {
  if (err instanceof NotFoundError) return 404
  if (err instanceof ConflictError) return 409
  return undefined
}

describe('buildErrorHandler', () => {
  let consoleError: jest.SpyInstance

  beforeEach(() => {
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleError.mockRestore()
  })

  it('uses the status the resolver returns and names the error by its class', () => {
    const res = createMockResponse()

    buildErrorHandler(statusFor)(
      new NotFoundError('movie not found'),
      createMockRequest(),
      asResponse(res),
      createMockNext()
    )

    expect(res.sentStatus).toBe(404)
    expect(res.sentBody).toEqual({ error: 'NotFoundError', message: 'movie not found' })
  })

  it('honours a resolver that maps different classes to different statuses', () => {
    const res = createMockResponse()

    buildErrorHandler(statusFor)(
      new ConflictError('genre already exists'),
      createMockRequest(),
      asResponse(res),
      createMockNext()
    )

    expect(res.sentStatus).toBe(409)
    expect(res.sentBody).toEqual({ error: 'ConflictError', message: 'genre already exists' })
  })

  it('falls back to 500 for an unmapped error', () => {
    const res = createMockResponse()

    buildErrorHandler(statusFor)(
      new Error('connection reset'),
      createMockRequest(),
      asResponse(res),
      createMockNext()
    )

    expect(res.sentStatus).toBe(500)
    expect(res.sentBody).toEqual({ error: 'InternalServerError' })
  })

  // Unmapped errors are by definition unvetted — their messages can carry
  // connection strings, SQL or stack detail, so none of it reaches the client.
  it('does not leak the message of an unmapped error', () => {
    const res = createMockResponse()

    buildErrorHandler(statusFor)(
      new Error('postgres://user:secret@db:5432'),
      createMockRequest(),
      asResponse(res),
      createMockNext()
    )

    expect(JSON.stringify(res.sentBody)).not.toContain('secret')
  })

  it('logs the unmapped error server-side', () => {
    const error = new Error('connection reset')

    buildErrorHandler(statusFor)(
      error,
      createMockRequest(),
      asResponse(createMockResponse()),
      createMockNext()
    )

    expect(consoleError).toHaveBeenCalledWith(error)
  })

  it('does not log errors the resolver mapped', () => {
    buildErrorHandler(statusFor)(
      new NotFoundError('movie not found'),
      createMockRequest(),
      asResponse(createMockResponse()),
      createMockNext()
    )

    expect(consoleError).not.toHaveBeenCalled()
  })
})
