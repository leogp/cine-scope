import request from 'supertest'

import { buildTestApp, validMovieBody } from '../../helpers/buildTestApp'

describe('app', () => {
  it('exposes a health check naming the service', async () => {
    const { app } = buildTestApp()

    const response = await request(app).get('/health')

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ status: 'ok', service: 'catalog-service' })
  })

  it('responds 404 with the requested path for unknown routes', async () => {
    const { app } = buildTestApp()

    const response = await request(app).get('/nope')

    expect(response.status).toBe(404)
    expect(response.body).toEqual({ error: 'NotFound', path: '/nope' })
  })

  it('responds 404 for a method the collection does not serve', async () => {
    const { app } = buildTestApp()

    const response = await request(app).delete('/genres/some-id')

    expect(response.status).toBe(404)
    expect(response.body.error).toBe('NotFound')
  })

  it('parses JSON request bodies', async () => {
    const { app } = buildTestApp()

    const response = await request(app)
      .post('/movies')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify(validMovieBody))

    expect(response.status).toBe(201)
  })

  it('reports every failing field of an invalid body in one response', async () => {
    const { app } = buildTestApp()

    const response = await request(app)
      .post('/movies')
      .send({ ...validMovieBody, title: '', originalLanguage: '' })

    expect(response.status).toBe(400)
    expect(response.body.error).toBe('ValidationError')
    expect(response.body.details.map((issue: { path: string[] }) => issue.path)).toEqual(
      expect.arrayContaining([['title'], ['originalLanguage']])
    )
  })
})
