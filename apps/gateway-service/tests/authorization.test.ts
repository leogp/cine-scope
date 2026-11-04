import { buildOptionalAuth } from '@cinescope/shared/infrastructure/http'
import type { Application } from 'express'
import jwt from 'jsonwebtoken'
import request from 'supertest'

import type { Env } from '@gateway/config/env'
import { buildApp } from '@gateway/infrastructure/http/app'
import { ACCESS_POLICY } from '@gateway/infrastructure/http/authorization/accessPolicy'
import { buildAuthorization } from '@gateway/infrastructure/http/authorization/buildAuthorization'
import { buildRouteTable, type ProxyRoute } from '@gateway/infrastructure/http/proxy/routeTable'
import { startStubService, type StubService } from './helpers/startStubService'

const SECRET = 'gateway-test-secret-0123456789'
const ISSUER = 'auth-service'

const bearer = (permissions: string[], roles: string[] = ['user']): string =>
  `Bearer ${jwt.sign(
    { sub: 'user-1', username: 'ripley', email: 'ripley@weyland.test', roles, permissions },
    SECRET,
    { issuer: ISSUER, expiresIn: '15m' }
  )}`

const READER = bearer(['catalog:read'])
const EDITOR = bearer(['catalog:read', 'catalog:write'], ['editor'])

describe('gateway authorization', () => {
  let auth: StubService
  let catalog: StubService
  let recommendation: StubService
  let app: Application

  const received = () => [...auth.received, ...catalog.received, ...recommendation.received]

  beforeEach(async () => {
    auth = await startStubService('auth-service')
    catalog = await startStubService('catalog-service')
    recommendation = await startStubService('recommendation-service')

    const routes: ProxyRoute[] = [
      { prefix: '/auth', target: auth.url },
      { prefix: '/catalog', target: catalog.url },
      { prefix: '/recommendation', target: recommendation.url },
    ]

    app = buildApp({
      routes,
      proxyTimeoutMs: 2_000,
      authenticate: buildOptionalAuth({ secret: SECRET, issuer: ISSUER }),
      authorize: buildAuthorization({ policy: ACCESS_POLICY, routes }),
    })
  })

  afterEach(async () => {
    await Promise.all([auth.close(), catalog.close(), recommendation.close()])
  })

  describe('/auth', () => {
    it.each(['/signup', '/login', '/refresh', '/logout'])(
      'lets an anonymous POST %s through',
      async (path) => {
        await request(app).post(`/auth${path}`).send({}).expect(200)

        expect(auth.received).toHaveLength(1)
        expect(auth.received[0].url).toBe(path)
      }
    )

    it('fails closed on a method no rule names: anonymous GET /auth/login is a 401', async () => {
      await request(app).get('/auth/login').expect(401)

      expect(auth.received).toHaveLength(0)
    })
  })

  describe('/catalog reads', () => {
    it.each(['/catalog/movies', '/catalog/movies/123'])(
      'lets an anonymous GET %s through',
      async (path) => {
        await request(app).get(path).expect(200)

        expect(catalog.received).toHaveLength(1)
      }
    )
  })

  describe('/catalog writes', () => {
    const writes = [
      ['post', '/catalog/movies'],
      ['put', '/catalog/movies/123'],
      ['delete', '/catalog/movies/123'],
    ] as const

    it.each(writes)('answers an anonymous %s %s with 401', async (method, path) => {
      const response = await request(app)[method](path).expect(401)

      expect(response.body).toEqual({ error: 'Unauthorized' })
      expect(catalog.received).toHaveLength(0)
    })

    it.each(writes)('answers %s %s with 403 without catalog:write', async (method, path) => {
      const response = await request(app)[method](path).set('Authorization', READER).expect(403)

      expect(response.body).toEqual({ error: 'Forbidden' })
      expect(catalog.received).toHaveLength(0)
    })

    it.each(writes)(
      'lets %s %s through with catalog:write, token byte-identical',
      async (method, path) => {
        await request(app)[method](path).set('Authorization', EDITOR).expect(200)

        expect(catalog.received).toHaveLength(1)
        expect(catalog.received[0].headers.authorization).toBe(EDITOR)
      }
    )

    // catalog defines no PATCH route today: the rule guards methods, not routes.
    it('answers PATCH without catalog:write with 403', async () => {
      await request(app).patch('/catalog/movies/123').set('Authorization', READER).expect(403)

      expect(catalog.received).toHaveLength(0)
    })

    it('decides on permissions, not roles: an admin role alone is a 403', async () => {
      await request(app)
        .post('/catalog/movies')
        .set('Authorization', bearer(['catalog:read'], ['admin']))
        .expect(403)

      expect(catalog.received).toHaveLength(0)
    })
  })

  describe('GET /<prefix>/health', () => {
    it.each(['/auth', '/catalog', '/recommendation'])('is public under %s', async (prefix) => {
      await request(app).get(`${prefix}/health`).expect(200)

      expect(received()).toHaveLength(1)
      expect(received()[0].url).toBe('/health')
    })
  })

  describe('fail-closed default', () => {
    it('answers an anonymous GET /recommendation/anything with 401', async () => {
      const response = await request(app).get('/recommendation/anything').expect(401)

      expect(response.body).toEqual({ error: 'Unauthorized' })
      expect(recommendation.received).toHaveLength(0)
    })

    it('lets any authenticated caller through, whatever their permissions', async () => {
      await request(app)
        .get('/recommendation/anything')
        .set('Authorization', bearer([]))
        .expect(200)

      expect(recommendation.received).toHaveLength(1)
    })
  })

  describe('path variants', () => {
    it.each(['/catalog/movies/', '/catalog/MOVIES', '/CATALOG/movies'])(
      'keep POST %s guarded',
      async (path) => {
        await request(app).post(path).expect(401)

        expect(catalog.received).toHaveLength(0)
      }
    )

    it.each(['/auth/login/', '/auth/LOGIN', '/AUTH/login'])('keep POST %s public', async (path) => {
      await request(app).post(path).send({}).expect(200)

      expect(auth.received).toHaveLength(1)
    })
  })

  describe('paths outside every prefix', () => {
    it.each(['/engagement/x', '/catalogue'])('leave GET %s to the gateway 404', async (path) => {
      const anonymous = await request(app).get(path).expect(404)
      const identified = await request(app).get(path).set('Authorization', EDITOR).expect(404)

      expect(anonymous.body).toEqual({ error: 'NotFound', path })
      expect(identified.body).toEqual({ error: 'NotFound', path })
      expect(received()).toHaveLength(0)
    })
  })

  describe('building the guard', () => {
    it('throws when the policy names a prefix missing from the route table', () => {
      expect(() =>
        buildAuthorization({
          policy: { everyPrefix: [], prefixes: [{ prefix: '/catalogs', rules: [] }] },
          routes: [{ prefix: '/catalog', target: 'http://127.0.0.1:1' }],
        })
      ).toThrow(/\/catalogs/)
    })

    it('accepts the shipped policy against the shipped route table', () => {
      const routes = buildRouteTable({
        AUTH_SERVICE_URL: 'http://auth-service:4001',
        CATALOG_SERVICE_URL: 'http://catalog-service:4002',
        RECOMMENDATION_SERVICE_URL: 'http://recommendation-service:4003',
        REVIEW_SERVICE_URL: 'http://review-service:4004',
        WATCHLIST_SERVICE_URL: 'http://watchlist-service:4005',
      } as Env)

      expect(() => buildAuthorization({ policy: ACCESS_POLICY, routes })).not.toThrow()
    })
  })
})
