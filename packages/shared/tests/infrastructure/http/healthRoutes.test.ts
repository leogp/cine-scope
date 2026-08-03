import { buildHealthRoutes } from '../../../src/infrastructure/http/healthRoutes'
import { asResponse, createMockNext, createMockRequest, createMockResponse } from './httpMocks'

// An express Router is itself a `(req, res, next)` handler, so it can be
// driven directly — no server or supertest needed.
describe('buildHealthRoutes', () => {
  it('answers GET /health with the service name', () => {
    const res = createMockResponse()

    buildHealthRoutes('catalog-service')(
      createMockRequest({ method: 'GET', url: '/health' }),
      asResponse(res),
      createMockNext()
    )

    expect(res.sentBody).toEqual({ status: 'ok', service: 'catalog-service' })
  })

  it('reports whichever service name it was built with', () => {
    const res = createMockResponse()

    buildHealthRoutes('auth-service')(
      createMockRequest({ method: 'GET', url: '/health' }),
      asResponse(res),
      createMockNext()
    )

    expect(res.sentBody).toEqual({ status: 'ok', service: 'auth-service' })
  })

  it('leaves the status at the express default of 200', () => {
    const res = createMockResponse()

    buildHealthRoutes('catalog-service')(
      createMockRequest({ method: 'GET', url: '/health' }),
      asResponse(res),
      createMockNext()
    )

    expect(res.status).not.toHaveBeenCalled()
  })

  it('falls through to next for any other path', () => {
    const res = createMockResponse()
    const next = createMockNext()

    buildHealthRoutes('catalog-service')(
      createMockRequest({ method: 'GET', url: '/movies' }),
      asResponse(res),
      next
    )

    expect(next).toHaveBeenCalled()
    expect(res.json).not.toHaveBeenCalled()
  })
})
