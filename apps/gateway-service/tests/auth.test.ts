import { buildOptionalAuth, type AuthContext } from '@cinescope/shared/infrastructure/http'
import type { Application, RequestHandler } from 'express'
import jwt from 'jsonwebtoken'
import request from 'supertest'

import { buildApp } from '@gateway/infrastructure/http/app'
import { startStubService, type StubService } from './helpers/startStubService'

const SECRET = 'gateway-test-secret-0123456789'
const ISSUER = 'auth-service'

const sign = (
  payload: Record<string, unknown>,
  options: jwt.SignOptions = {},
  secret: string = SECRET
): string => jwt.sign(payload, secret, { issuer: ISSUER, expiresIn: '15m', ...options })

// Authorization has its own suite (authorization.test.ts); here it is a no-op.
const passThrough: RequestHandler = (_req, _res, next) => next()

const validClaims = {
  sub: 'user-1',
  username: 'ripley',
  email: 'ripley@weyland.test',
  roles: ['editor'],
  permissions: ['catalog:write'],
}

describe('gateway authentication', () => {
  let auth: StubService
  let catalog: StubService
  let app: Application
  // What `req.auth` held each time authentication handed the request on.
  let observed: (AuthContext | undefined)[]

  beforeEach(async () => {
    auth = await startStubService('auth-service')
    catalog = await startStubService('catalog-service')
    observed = []

    const optionalAuth = buildOptionalAuth({ secret: SECRET, issuer: ISSUER })

    // The proxy does not expose req.auth downstream, so record it at the moment
    // the real middleware calls next — from the slot buildApp mounts it in.
    const authenticate: RequestHandler = (req, res, next) =>
      optionalAuth(req, res, () => {
        observed.push(req.auth)
        next()
      })

    app = buildApp({
      routes: [
        { prefix: '/auth', target: auth.url },
        { prefix: '/catalog', target: catalog.url },
      ],
      proxyTimeoutMs: 2_000,
      authenticate,
      authorize: passThrough,
    })
  })

  afterEach(async () => {
    await Promise.all([auth.close(), catalog.close()])
  })

  describe('anonymous callers', () => {
    it('reach auth-service on /auth/login without a token', async () => {
      await request(app)
        .post('/auth/login')
        .send({ email: 'ripley@weyland.test', password: 'x' })
        .expect(200)

      expect(auth.received).toHaveLength(1)
      expect(auth.received[0].url).toBe('/login')
      expect(auth.received[0].headers.authorization).toBeUndefined()
      expect(observed).toEqual([undefined])
    })

    it('reach catalog-service on GET /catalog/movies without a token', async () => {
      await request(app).get('/catalog/movies').expect(200)

      expect(catalog.received).toHaveLength(1)
      expect(catalog.received[0].headers.authorization).toBeUndefined()
      expect(observed).toEqual([undefined])
    })
  })

  describe('a valid token', () => {
    it('reaches the service with the Authorization header byte-identical', async () => {
      const header = `Bearer ${sign(validClaims)}`

      await request(app).get('/catalog/movies').set('Authorization', header).expect(200)

      expect(catalog.received).toHaveLength(1)
      expect(catalog.received[0].headers.authorization).toBe(header)
    })

    it('identifies the caller at the gateway', async () => {
      await request(app)
        .get('/catalog/movies')
        .set('Authorization', `Bearer ${sign(validClaims)}`)
        .expect(200)

      expect(observed).toEqual([
        {
          userId: 'user-1',
          username: 'ripley',
          email: 'ripley@weyland.test',
          roles: ['editor'],
          permissions: ['catalog:write'],
        },
      ])
    })
  })

  describe('an unusable token', () => {
    it.each([
      ['a garbage token', 'Bearer not-a-jwt'],
      ['an expired token', `Bearer ${sign(validClaims, { expiresIn: '-1s' })}`],
      [
        'a token signed with another secret',
        `Bearer ${sign(validClaims, {}, 'a-different-secret-0123456789')}`,
      ],
      ['a non-Bearer scheme', 'Basic cmlwbGV5Om5vc3Ryb21v'],
    ])('is rejected at the gateway: %s', async (_case, header) => {
      const response = await request(app)
        .get('/catalog/movies')
        .set('Authorization', header)
        .expect(401)

      expect(response.body).toEqual({ error: 'Unauthorized' })
      expect(catalog.received).toHaveLength(0)
      expect(observed).toHaveLength(0)
    })

    // Public routes are no exception: a broken token is never downgraded to anonymous.
    it('is rejected even on a public route such as /auth/login', async () => {
      await request(app)
        .post('/auth/login')
        .set('Authorization', 'Bearer not-a-jwt')
        .send({ email: 'ripley@weyland.test', password: 'x' })
        .expect(401)

      expect(auth.received).toHaveLength(0)
    })
  })

  describe('/health', () => {
    it.each([
      ['no token', undefined],
      ['a valid token', `Bearer ${sign(validClaims)}`],
      ['a garbage token', 'Bearer not-a-jwt'],
    ])('answers 200 with %s, before authentication runs', async (_case, header) => {
      const call = request(app).get('/health')
      const response = await (header ? call.set('Authorization', header) : call).expect(200)

      expect(response.body).toEqual({ status: 'ok', service: 'gateway-service' })
      expect(observed).toHaveLength(0)
    })
  })
})
