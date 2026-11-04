import { buildOptionalAuth, type AuthContext } from '@cinescope/shared/infrastructure/http'
import type { Application, Request } from 'express'
import { MemoryStore, type ClientRateLimitInfo, type Store } from 'express-rate-limit'
import jwt from 'jsonwebtoken'
import request from 'supertest'

import { buildApp } from '@gateway/infrastructure/http/app'
import { ACCESS_POLICY } from '@gateway/infrastructure/http/authorization/accessPolicy'
import { buildAuthorization } from '@gateway/infrastructure/http/authorization/buildAuthorization'
import type { ProxyRoute } from '@gateway/infrastructure/http/proxy/routeTable'
import {
  buildRateLimit,
  callerKey,
  clientIpKey,
  type StoreFactory,
} from '@gateway/infrastructure/http/rateLimit/buildRateLimit'
import { listen, sendFrom, type GatewayServer } from './helpers/sendFrom'
import { startStubService, type StubService } from './helpers/startStubService'

const SECRET = 'gateway-test-secret-0123456789'
const ISSUER = 'auth-service'
// Long on purpose: no case waits for a reset, and a window that rolled over
// mid-test would turn a 429 into a 200.
const WINDOW_MS = 60_000

const tokenFor = (sub: string, permissions: string[] = []): string =>
  `Bearer ${jwt.sign(
    { sub, username: sub, email: `${sub}@weyland.test`, roles: ['user'], permissions },
    SECRET,
    { issuer: ISSUER, expiresIn: '15m' }
  )}`

const ALICE = tokenFor('alice')
const BOB = tokenFor('bob')
const READER = tokenFor('reader', ['catalog:read'])

const memoryStores: StoreFactory = () => new MemoryStore()

/** A store whose Redis is gone: every increment rejects. */
class UnavailableStore implements Store {
  increment(): Promise<ClientRateLimitInfo> {
    return Promise.reject(new Error('The client is offline'))
  }
  decrement(): void {
    // Nothing to undo: nothing was ever counted.
  }
  resetKey(): void {
    // Nothing to reset.
  }
}

const requestWith = (fields: Partial<Request>): Request => fields as Request

describe('gateway rate limiting', () => {
  let auth: StubService
  let catalog: StubService
  let recommendation: StubService
  let routes: ProxyRoute[]
  let server: GatewayServer | undefined

  beforeEach(async () => {
    auth = await startStubService('auth-service')
    catalog = await startStubService('catalog-service')
    recommendation = await startStubService('recommendation-service')
    routes = [
      { prefix: '/auth', target: auth.url },
      { prefix: '/catalog', target: catalog.url },
      { prefix: '/recommendation', target: recommendation.url },
    ]
  })

  afterEach(async () => {
    jest.restoreAllMocks()
    await server?.close()
    server = undefined
    await Promise.all([auth.close(), catalog.close(), recommendation.close()])
  })

  const buildGateway = ({
    global = 100,
    credentials = 100,
    createStore = memoryStores,
  }: { global?: number; credentials?: number; createStore?: StoreFactory } = {}): Application =>
    buildApp({
      routes,
      proxyTimeoutMs: 2_000,
      authenticate: buildOptionalAuth({ secret: SECRET, issuer: ISSUER }),
      rateLimit: buildRateLimit({
        global: { windowMs: WINDOW_MS, limit: global },
        credentials: { windowMs: WINDOW_MS, limit: credentials },
        createStore,
      }),
      authorize: buildAuthorization({ policy: ACCESS_POLICY, routes }),
    })

  describe('the global tier', () => {
    it('lets a request under the limit through with draft-8 headers only', async () => {
      const app = buildGateway({ global: 3 })

      const response = await request(app).get('/catalog/movies').expect(200)

      expect(response.headers['ratelimit']).toMatch(/"global"; r=2; t=\d+/)
      expect(response.headers['ratelimit-policy']).toMatch(/"global"; q=3; w=60; pk=:/)
      expect(response.headers['x-ratelimit-limit']).toBeUndefined()
      expect(response.headers['x-ratelimit-remaining']).toBeUndefined()
      expect(response.headers['retry-after']).toBeUndefined()
    })

    it('answers the request over the limit with 429, the envelope and Retry-After', async () => {
      const app = buildGateway({ global: 2 })
      await request(app).get('/catalog/movies').expect(200)
      await request(app).get('/catalog/movies').expect(200)

      const response = await request(app).get('/catalog/movies').expect(429)

      expect(response.body).toEqual({ error: 'TooManyRequests', message: expect.any(String) })
      expect(response.headers['retry-after']).toMatch(/^\d+$/)
      expect(Number(response.headers['retry-after'])).toBeGreaterThan(0)
      expect(Number(response.headers['retry-after'])).toBeLessThanOrEqual(60)
      expect(response.headers['ratelimit']).toMatch(/"global"; r=0/)
      expect(catalog.received).toHaveLength(2)
    })

    it('gives two users on one IP independent quotas', async () => {
      const app = buildGateway({ global: 2 })
      await request(app).get('/recommendation/feed').set('Authorization', ALICE).expect(200)
      await request(app).get('/recommendation/feed').set('Authorization', ALICE).expect(200)
      await request(app).get('/recommendation/feed').set('Authorization', ALICE).expect(429)

      await request(app).get('/recommendation/feed').set('Authorization', BOB).expect(200)
    })

    it('gives anonymous callers on two IPs independent quotas', async () => {
      server = await listen(buildGateway({ global: 2 }))
      const movies = `${server.url}/catalog/movies`

      expect((await sendFrom('127.0.0.2', movies)).status).toBe(200)
      expect((await sendFrom('127.0.0.2', movies)).status).toBe(200)
      expect((await sendFrom('127.0.0.2', movies)).status).toBe(429)

      expect((await sendFrom('127.0.0.3', movies)).status).toBe(200)
    })

    it('gives one user on two IPs a single quota', async () => {
      server = await listen(buildGateway({ global: 2 }))
      const feed = `${server.url}/recommendation/feed`
      const asAlice = { headers: { authorization: ALICE } }

      expect((await sendFrom('127.0.0.2', feed, asAlice)).status).toBe(200)
      expect((await sendFrom('127.0.0.3', feed, asAlice)).status).toBe(200)
      expect((await sendFrom('127.0.0.2', feed, asAlice)).status).toBe(429)
      expect((await sendFrom('127.0.0.3', feed, asAlice)).status).toBe(429)

      // The addresses' own (anonymous) quotas were never touched.
      expect((await sendFrom('127.0.0.3', `${server.url}/catalog/movies`)).status).toBe(200)
    })

    it('counts a request that authorize answers with 403', async () => {
      const app = buildGateway({ global: 2 })
      await request(app).post('/catalog/movies').set('Authorization', READER).expect(403)
      await request(app).post('/catalog/movies').set('Authorization', READER).expect(403)

      const response = await request(app)
        .post('/catalog/movies')
        .set('Authorization', READER)
        .expect(429)

      expect(response.body.error).toBe('TooManyRequests')
      expect(catalog.received).toHaveLength(0)
    })
  })

  describe('the credentials tier', () => {
    it('rejects before the global tier', async () => {
      const app = buildGateway({ global: 10, credentials: 2 })
      await request(app).post('/auth/login').send({}).expect(200)
      await request(app).post('/auth/login').send({}).expect(200)

      const rejected = await request(app).post('/auth/login').send({}).expect(429)

      expect(rejected.headers['ratelimit']).toMatch(/"credentials"; r=0/)
      expect(rejected.headers['ratelimit']).toMatch(/"global"; r=7/)
      expect(auth.received).toHaveLength(2)

      const other = await request(app).get('/catalog/movies').expect(200)
      expect(other.headers['ratelimit']).not.toMatch(/credentials/)
    })

    it('shares one quota across login and signup', async () => {
      const app = buildGateway({ credentials: 2 })
      await request(app).post('/auth/login').send({}).expect(200)
      await request(app).post('/auth/signup').send({}).expect(200)

      await request(app).post('/auth/login').send({}).expect(429)
    })

    it.each(['/auth/LOGIN', '/auth/login/', '/AUTH/login'])(
      'counts the path variant POST %s',
      async (variant) => {
        const app = buildGateway({ credentials: 1 })
        await request(app).post('/auth/login').send({}).expect(200)

        await request(app).post(variant).send({}).expect(429)
      }
    )

    it.each(['/auth/refresh', '/auth/logout'])(
      'leaves POST %s to the global tier alone',
      async (path) => {
        const app = buildGateway({ credentials: 1 })

        for (let i = 0; i < 3; i++) {
          const response = await request(app).post(path).send({}).expect(200)
          expect(response.headers['ratelimit']).toMatch(/"global"/)
          expect(response.headers['ratelimit']).not.toMatch(/credentials/)
        }
      }
    )

    it('keys by IP even when the caller is identified', async () => {
      const app = buildGateway({ credentials: 1 })
      await request(app).post('/auth/login').set('Authorization', ALICE).send({}).expect(200)

      await request(app).post('/auth/login').set('Authorization', BOB).send({}).expect(429)
    })
  })

  describe('/health', () => {
    it('is never limited and never counted', async () => {
      const app = buildGateway({ global: 1 })

      for (let i = 0; i < 5; i++) {
        const response = await request(app).get('/health').expect(200)
        expect(response.headers['ratelimit']).toBeUndefined()
      }

      await request(app).get('/catalog/movies').expect(200)
      await request(app).get('/catalog/movies').expect(429)
      await request(app).get('/health').expect(200)
    })
  })

  describe('when the store fails', () => {
    // Outage logging belongs to the store's owner (redisAvailability.test.ts);
    // the limiter must not add a line per request or per tier.
    it('lets requests through unlimited, logging nothing per request (fail open)', async () => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined)
      const error = jest.spyOn(console, 'error').mockImplementation(() => undefined)
      const app = buildGateway({
        global: 1,
        credentials: 1,
        createStore: () => new UnavailableStore(),
      })

      for (let i = 0; i < 3; i++) {
        const response = await request(app).post('/auth/login').send({}).expect(200)
        expect(response.headers['ratelimit']).toBeUndefined()
      }

      expect(auth.received).toHaveLength(3)
      expect(warn).not.toHaveBeenCalled()
      expect(error).not.toHaveBeenCalled()
    })
  })

  describe('keys', () => {
    const alice: AuthContext = {
      userId: 'alice',
      username: 'alice',
      email: 'alice@weyland.test',
      roles: ['user'],
      permissions: [],
    }

    it('keys an identified caller by user, whatever the address', () => {
      expect(callerKey(requestWith({ ip: '127.0.0.1', auth: alice }))).toBe('user:alice')
    })

    it('keys an anonymous caller by IP', () => {
      expect(callerKey(requestWith({ ip: '127.0.0.1' }))).toBe('ip:127.0.0.1')
    })

    it('reduces IPv6 addresses to their /64', () => {
      const a = clientIpKey(requestWith({ ip: '2001:db8:1:2:aaaa:bbbb:cccc:dddd' }))
      const b = clientIpKey(requestWith({ ip: '2001:db8:1:2::1' }))
      const otherPrefix = clientIpKey(requestWith({ ip: '2001:db8:1:3::1' }))

      expect(a).toMatch(/^ip:/)
      expect(a).toBe(b)
      expect(a).not.toBe(otherPrefix)
    })

    it('treats an IPv4-mapped IPv6 address as IPv4', () => {
      expect(clientIpKey(requestWith({ ip: '::ffff:127.0.0.1' }))).toBe('ip:127.0.0.1')
    })
  })
})
