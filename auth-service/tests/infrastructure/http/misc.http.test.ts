import request from 'supertest'

import { buildTestApp } from '../../helpers/buildTestApp'

describe('app', () => {
  it('exposes a health check', async () => {
    const { app } = buildTestApp()

    const response = await request(app).get('/health')

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ status: 'ok', service: 'auth-service' })
  })

  it('responds 404 with the requested path for unknown routes', async () => {
    const { app } = buildTestApp()

    const response = await request(app).get('/nope')

    expect(response.status).toBe(404)
    expect(response.body).toEqual({ error: 'NotFound', path: '/nope' })
  })
})
