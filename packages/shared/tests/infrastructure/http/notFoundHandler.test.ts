import { notFoundHandler } from '../../../src/infrastructure/http/notFoundHandler'
import { asResponse, createMockRequest, createMockResponse } from './httpMocks'

describe('notFoundHandler', () => {
  it('responds 404 echoing the requested path', () => {
    const res = createMockResponse()

    notFoundHandler(createMockRequest({ originalUrl: '/nope' }), asResponse(res))

    expect(res.sentStatus).toBe(404)
    expect(res.sentBody).toEqual({ error: 'NotFound', path: '/nope' })
  })

  it('reports the full original url, query string included', () => {
    const res = createMockResponse()

    notFoundHandler(createMockRequest({ originalUrl: '/movies/1/extra?page=2' }), asResponse(res))

    expect(res.sentBody).toEqual({ error: 'NotFound', path: '/movies/1/extra?page=2' })
  })
})
