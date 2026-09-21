import request from 'supertest'

import { CATALOG_WRITE } from '@catalog/infrastructure/http/permissions'
import { authHeader, signAccessToken } from '../../helpers/authToken'
import {
  buildTestApp,
  validCompanyBody,
  validGenreBody,
  validMovieBody,
  validPersonBody,
  validSeriesBody,
} from '../../helpers/buildTestApp'

/**
 * The catalog is public to read and closed to write: every mutating route sits
 * behind an auth-service access token carrying `catalog:write`.
 */
describe('write route authorization', () => {
  const writeRequests = [
    ['POST', '/movies', validMovieBody],
    ['POST', '/series', validSeriesBody],
    ['POST', '/people', validPersonBody],
    ['POST', '/genres', validGenreBody],
    ['POST', '/companies', validCompanyBody],
  ] as const

  describe.each(writeRequests)('%s %s', (_method, path, body) => {
    it('responds 401 without a token', async () => {
      const { app } = buildTestApp()

      const response = await request(app).post(path).send(body)

      expect(response.status).toBe(401)
      expect(response.body).toEqual({ error: 'Unauthorized' })
    })

    it('responds 403 for a token without catalog:write', async () => {
      const { app } = buildTestApp()

      const response = await request(app)
        .post(path)
        .set('Authorization', authHeader({ roles: ['user'], permissions: ['catalog:read'] }))
        .send(body)

      expect(response.status).toBe(403)
      expect(response.body).toEqual({ error: 'Forbidden' })
    })

    it('succeeds for a token with catalog:write', async () => {
      const { app } = buildTestApp()

      const response = await request(app).post(path).set('Authorization', authHeader()).send(body)

      expect(response.status).toBe(201)
    })
  })

  // Rejection precedes validation, so an anonymous caller learns nothing about
  // the schema it failed to satisfy.
  it('rejects an unauthenticated write before validating the body', async () => {
    const { app } = buildTestApp()

    const response = await request(app).post('/movies').send({})

    expect(response.status).toBe(401)
    expect(response.body).toEqual({ error: 'Unauthorized' })
  })

  describe.each([
    ['a malformed Authorization header', 'Bearer'],
    ['a non-Bearer scheme', 'Basic dXNlcjpwYXNz'],
    ['a token that is not a JWT', 'Bearer not-a-jwt'],
  ])('given %s', (_case, header) => {
    it('responds 401', async () => {
      const { app } = buildTestApp()

      const response = await request(app)
        .post('/movies')
        .set('Authorization', header)
        .send(validMovieBody)

      expect(response.status).toBe(401)
    })
  })

  it('responds 401 for an expired token', async () => {
    const { app } = buildTestApp()

    const response = await request(app)
      .post('/movies')
      .set('Authorization', `Bearer ${signAccessToken({ expiresIn: '-1s' })}`)
      .send(validMovieBody)

    expect(response.status).toBe(401)
  })

  it('responds 401 for a token signed with another secret', async () => {
    const { app } = buildTestApp()

    const response = await request(app)
      .post('/movies')
      .set('Authorization', `Bearer ${signAccessToken({ secret: 'another-secret-0123456789' })}`)
      .send(validMovieBody)

    expect(response.status).toBe(401)
  })

  // Only auth-service mints access tokens; a token from any other issuer in the
  // platform must not pass as one.
  it('responds 401 for a token from another issuer', async () => {
    const { app } = buildTestApp()

    const response = await request(app)
      .post('/movies')
      .set('Authorization', `Bearer ${signAccessToken({ issuer: 'gateway-service' })}`)
      .send(validMovieBody)

    expect(response.status).toBe(401)
  })

  it('guards updates and deletes as well as creates', async () => {
    const { app } = buildTestApp()

    const created = await request(app)
      .post('/movies')
      .set('Authorization', authHeader())
      .send(validMovieBody)

    const readOnly = authHeader({ roles: ['user'], permissions: ['catalog:read'] })

    await request(app).put(`/movies/${created.body.id}`).send(validMovieBody).expect(401)
    await request(app)
      .put(`/movies/${created.body.id}`)
      .set('Authorization', readOnly)
      .send(validMovieBody)
      .expect(403)

    await request(app).delete(`/movies/${created.body.id}`).expect(401)
    await request(app)
      .delete(`/movies/${created.body.id}`)
      .set('Authorization', readOnly)
      .expect(403)

    // Still there: neither rejected request reached a use case.
    await request(app).get(`/movies/${created.body.id}`).expect(200)
  })

  it('accepts a token whose permissions include catalog:write among others', async () => {
    const { app } = buildTestApp()

    const response = await request(app)
      .post('/genres')
      .set(
        'Authorization',
        authHeader({ roles: ['admin'], permissions: ['users:manage', CATALOG_WRITE] })
      )
      .send(validGenreBody)

    expect(response.status).toBe(201)
  })
})

describe('read routes', () => {
  it('serves the movie list anonymously', async () => {
    const { app } = buildTestApp()

    await request(app).get('/movies').expect(200)
  })

  it('serves a movie by id anonymously', async () => {
    const { app } = buildTestApp()

    const created = await request(app)
      .post('/movies')
      .set('Authorization', authHeader())
      .send(validMovieBody)

    await request(app).get(`/movies/${created.body.id}`).expect(200)
  })

  it('serves the health check anonymously', async () => {
    const { app } = buildTestApp()

    await request(app).get('/health').expect(200)
  })
})
