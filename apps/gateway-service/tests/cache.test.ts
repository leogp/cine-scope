import type { Application, RequestHandler } from 'express'
import { MemoryStore } from 'express-rate-limit'
import request from 'supertest'
import { gzipSync } from 'zlib'

import { buildApp } from '@gateway/infrastructure/http/app'
import { buildResponseCache } from '@gateway/infrastructure/http/cache/buildResponseCache'
import type { ResponseCacheStore } from '@gateway/infrastructure/http/cache/responseCacheStore'
import { buildRateLimit } from '@gateway/infrastructure/http/rateLimit/buildRateLimit'
import { MemoryResponseCacheStore } from './helpers/memoryResponseCacheStore'
import { startStubService, type StubResponder, type StubService } from './helpers/startStubService'

const TTL_MS = 30_000
const MAX_ENTRY_BYTES = 1_024

// Authentication and authorization have their own suites; every request here is allowed.
const passThrough: RequestHandler = (_req, _res, next) => next()

const offline = (): Promise<never> => Promise.reject(new Error('The client is offline'))

/** Redis is gone: every command rejects. */
const failingStore: ResponseCacheStore = {
  getGeneration: offline,
  incrementGeneration: offline,
  getEntry: offline,
  setEntry: offline,
}

/** Lookups miss at once; stores and increments never settle. */
const stalledStore: ResponseCacheStore = {
  getGeneration: () => Promise.resolve(0),
  incrementGeneration: () => new Promise<void>(() => undefined),
  getEntry: () => Promise.resolve(undefined),
  setEntry: () => new Promise<void>(() => undefined),
}

describe('gateway response cache', () => {
  let catalog: StubService
  let auth: StubService
  let respond: StubResponder
  let clock: { now: number }
  let store: MemoryResponseCacheStore

  /** Numbers each answer, so a body seen twice provably came from the cache. */
  const numbered =
    (status = 200, headers: Record<string, string> = {}): StubResponder =>
    (received, res) => {
      res.set(headers).status(status).json({ url: received.url, call: catalog.received.length })
    }

  const getsOkWritesWith =
    (status: number): StubResponder =>
    (received, res) =>
      received.method === 'GET'
        ? numbered()(received, res)
        : res.status(status).json({ method: received.method })

  beforeEach(async () => {
    respond = numbered()
    catalog = await startStubService('catalog-service', (received, res) => respond(received, res))
    auth = await startStubService('auth-service')
    clock = { now: 0 }
    store = new MemoryResponseCacheStore(() => clock.now)
  })

  afterEach(async () => {
    jest.restoreAllMocks()
    await Promise.all([catalog.close(), auth.close()])
  })

  const buildGateway = ({
    cacheStore = store,
    rateLimit = passThrough,
  }: { cacheStore?: ResponseCacheStore; rateLimit?: RequestHandler } = {}): Application =>
    buildApp({
      routes: [
        { prefix: '/auth', target: auth.url },
        { prefix: '/catalog', target: catalog.url },
      ],
      proxyTimeoutMs: 2_000,
      authenticate: passThrough,
      rateLimit,
      authorize: passThrough,
      cache: buildResponseCache({
        store: cacheStore,
        ttlMs: TTL_MS,
        maxEntryBytes: MAX_ENTRY_BYTES,
      }),
    })

  describe('hits and misses', () => {
    it('misses first, then answers from the cache without reaching catalog', async () => {
      const app = buildGateway()

      const miss = await request(app).get('/catalog/movies/42').expect(200)
      const hit = await request(app).get('/catalog/movies/42').expect(200)

      expect(miss.headers['x-cache']).toBe('MISS')
      expect(hit.headers['x-cache']).toBe('HIT')
      expect(catalog.received).toHaveLength(1)
      expect(hit.text).toBe(miss.text)
      expect(hit.headers['content-type']).toBe(miss.headers['content-type'])
      expect(hit.headers['content-length']).toBe(String(Buffer.byteLength(miss.text)))
    })

    it('serves a reordered query from the same entry', async () => {
      const app = buildGateway()

      await request(app).get('/catalog/movies?page=2&pageSize=10').expect('X-Cache', 'MISS')
      await request(app).get('/catalog/movies?pageSize=10&page=2').expect('X-Cache', 'HIT')

      expect(catalog.received).toHaveLength(1)
    })

    it('drops unknown parameters from the key, not from the request', async () => {
      const app = buildGateway()

      await request(app).get('/catalog/movies?sort=title&page=2').expect('X-Cache', 'MISS')
      await request(app).get('/catalog/movies?page=2').expect('X-Cache', 'HIT')
      await request(app).get('/catalog/movies?page=02&utm_source=mail').expect('X-Cache', 'HIT')

      expect(store.entryCount).toBe(1)
      expect(catalog.received[0].url).toBe('/movies?sort=title&page=2')
    })

    it('shares one entry across the path variants catalog serves as one route', async () => {
      const app = buildGateway()

      await request(app).get('/catalog/movies/42').expect('X-Cache', 'MISS')
      await request(app).get('/catalog/MOVIES/42/').expect('X-Cache', 'HIT')

      expect(catalog.received).toHaveLength(1)
    })

    it('does not cache a parameter given twice', async () => {
      const app = buildGateway()

      await request(app).get('/catalog/movies?page=1&page=2').expect('X-Cache', 'MISS')
      await request(app).get('/catalog/movies?page=1&page=2').expect('X-Cache', 'MISS')

      expect(catalog.received).toHaveLength(2)
      expect(store.entryCount).toBe(0)
    })

    it('replays Content-Type and nothing else the service sent', async () => {
      respond = numbered(200, { 'Set-Cookie': 'session=abc', 'X-Catalog-Trace': 'abc' })
      const app = buildGateway()

      const miss = await request(app).get('/catalog/genres/7').expect('X-Cache', 'MISS')
      const hit = await request(app).get('/catalog/genres/7').expect('X-Cache', 'HIT')

      expect(miss.headers['set-cookie']).toBeDefined()
      expect(hit.headers['set-cookie']).toBeUndefined()
      expect(hit.headers['x-catalog-trace']).toBeUndefined()
      expect(hit.headers['content-type']).toBe('application/json; charset=utf-8')
    })
  })

  describe('what is stored', () => {
    it('stores a Cache-Control that allows shared caching', async () => {
      respond = numbered(200, { 'Cache-Control': 'public, max-age=60' })
      const app = buildGateway()

      await request(app).get('/catalog/movies/42').expect('X-Cache', 'MISS')
      await request(app).get('/catalog/movies/42').expect('X-Cache', 'HIT')
    })

    it('assembles a chunked body within the maximum, byte for byte', async () => {
      respond = (_received, res) => {
        res.status(200).type('application/json')
        res.write('{"title":')
        res.write('"Amélie"')
        res.end('}')
      }
      const app = buildGateway()

      await request(app).get('/catalog/movies/42').expect('X-Cache', 'MISS')
      const hit = await request(app).get('/catalog/movies/42').expect('X-Cache', 'HIT')

      expect(hit.body).toEqual({ title: 'Amélie' })
      expect(hit.headers['content-length']).toBe(String(Buffer.byteLength('{"title":"Amélie"}')))
    })
  })

  describe('what is never stored', () => {
    const oversized = 'x'.repeat(MAX_ENTRY_BYTES)

    it.each<[string, StubResponder]>([
      ['a 404', numbered(404)],
      ['a 500', numbered(500)],
      ['Cache-Control: no-store', numbered(200, { 'Cache-Control': 'no-store' })],
      ['Cache-Control: private', numbered(200, { 'Cache-Control': 'private, max-age=60' })],
      [
        'a Content-Encoding',
        (_received, res) => {
          res
            .status(200)
            .set('Content-Encoding', 'gzip')
            .type('application/json')
            .end(gzipSync('{"compressed":true}'))
        },
      ],
      [
        'a body over the maximum, with Content-Length',
        (_received, res) => {
          res.status(200).json({ padding: oversized })
        },
      ],
      [
        'a chunked body over the maximum',
        (_received, res) => {
          res.status(200).type('application/json')
          res.write('{"padding":"')
          res.write(oversized)
          res.end('"}')
        },
      ],
    ])('does not store %s', async (_case, responder) => {
      respond = responder
      const app = buildGateway()

      await request(app).get('/catalog/movies/42').expect('X-Cache', 'MISS')
      await request(app).get('/catalog/movies/42').expect('X-Cache', 'MISS')

      expect(catalog.received).toHaveLength(2)
      expect(store.entryCount).toBe(0)
    })

    it('does not store the 502 of an unreachable service', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => undefined)
      const app = buildGateway()
      await catalog.close()

      for (let i = 0; i < 2; i++) {
        const response = await request(app).get('/catalog/movies/42').expect(502)
        expect(response.headers['x-cache']).toBe('MISS')
      }
      expect(store.entryCount).toBe(0)
    })

    it('neither stores nor marks a POST', async () => {
      const app = buildGateway()

      for (let i = 0; i < 2; i++) {
        const response = await request(app).post('/catalog/movies').send({}).expect(200)
        expect(response.headers['x-cache']).toBeUndefined()
      }
      expect(catalog.received).toHaveLength(2)
    })

    it('passes HEAD through, even when GET is cached', async () => {
      const app = buildGateway()
      await request(app).get('/catalog/movies/42').expect('X-Cache', 'MISS')
      await request(app).get('/catalog/movies/42').expect('X-Cache', 'HIT')

      const head = await request(app).head('/catalog/movies/42').expect(200)

      expect(head.headers['x-cache']).toBeUndefined()
      expect(catalog.received.map((received) => received.method)).toEqual(['GET', 'HEAD'])
    })

    it.each(['/catalog/health', '/catalog/movies/42/credits', '/auth/me'])(
      'leaves GET %s alone',
      async (path) => {
        const app = buildGateway()

        for (let i = 0; i < 2; i++) {
          const response = await request(app).get(path).expect(200)
          expect(response.headers['x-cache']).toBeUndefined()
        }
        expect(catalog.received.length + auth.received.length).toBe(2)
        expect(store.entryCount).toBe(0)
      }
    )
  })

  describe('invalidation', () => {
    it.each(['post', 'put', 'patch', 'delete'] as const)(
      'makes every movies entry miss after a 2xx %s on movies',
      async (method) => {
        respond = getsOkWritesWith(201)
        const app = buildGateway()
        await request(app).get('/catalog/movies').expect('X-Cache', 'MISS')
        await request(app).get('/catalog/movies/42').expect('X-Cache', 'MISS')

        await request(app)[method]('/catalog/movies/42').send({}).expect(201)

        await request(app).get('/catalog/movies').expect('X-Cache', 'MISS')
        await request(app).get('/catalog/movies/42').expect('X-Cache', 'MISS')
        expect(catalog.received).toHaveLength(5)
      }
    )

    it('invalidates nothing on a 2xx OPTIONS', async () => {
      respond = getsOkWritesWith(204)
      const app = buildGateway()
      await request(app).get('/catalog/movies/42').expect('X-Cache', 'MISS')

      await request(app).options('/catalog/movies/42').expect(204)

      await request(app).get('/catalog/movies/42').expect('X-Cache', 'HIT')
      expect(catalog.received.map((received) => received.method)).toEqual(['GET', 'OPTIONS'])
    })

    it('invalidates nothing on a 4xx write', async () => {
      respond = getsOkWritesWith(400)
      const app = buildGateway()
      await request(app).get('/catalog/movies/42').expect('X-Cache', 'MISS')

      await request(app).put('/catalog/movies/42').send({}).expect(400)

      await request(app).get('/catalog/movies/42').expect('X-Cache', 'HIT')
    })

    it('invalidates only the collection written to', async () => {
      respond = getsOkWritesWith(201)
      const app = buildGateway()
      await request(app).get('/catalog/movies/42').expect('X-Cache', 'MISS')
      await request(app).get('/catalog/genres/7').expect('X-Cache', 'MISS')

      await request(app).post('/catalog/genres').send({}).expect(201)

      await request(app).get('/catalog/movies/42').expect('X-Cache', 'HIT')
      await request(app).get('/catalog/genres/7').expect('X-Cache', 'MISS')
    })
  })

  describe('expiry', () => {
    it('misses once the TTL has passed', async () => {
      const app = buildGateway()
      await request(app).get('/catalog/movies/42').expect('X-Cache', 'MISS')

      clock.now = TTL_MS - 1
      await request(app).get('/catalog/movies/42').expect('X-Cache', 'HIT')

      clock.now = TTL_MS
      await request(app).get('/catalog/movies/42').expect('X-Cache', 'MISS')
      expect(catalog.received).toHaveLength(2)
    })
  })

  describe('with the rate limiter', () => {
    it('counts a hit against the quota', async () => {
      const app = buildGateway({
        rateLimit: buildRateLimit({
          global: { windowMs: 60_000, limit: 2 },
          credentials: { windowMs: 60_000, limit: 2 },
          createStore: () => new MemoryStore(),
        }),
      })

      await request(app).get('/catalog/movies/42').expect(200).expect('X-Cache', 'MISS')
      const hit = await request(app).get('/catalog/movies/42').expect(200).expect('X-Cache', 'HIT')
      await request(app).get('/catalog/movies/42').expect(429)

      expect(hit.headers['ratelimit']).toMatch(/"global"; r=0/)
      expect(catalog.received).toHaveLength(1)
    })
  })

  describe('when the store fails', () => {
    // Outage logging belongs to the store's owner (redisAvailability.test.ts).
    it('lets every request reach catalog, logging nothing per request (fail open)', async () => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined)
      const error = jest.spyOn(console, 'error').mockImplementation(() => undefined)
      const app = buildGateway({ cacheStore: failingStore })

      await request(app).get('/catalog/movies/42').expect(200).expect('X-Cache', 'MISS')
      await request(app).get('/catalog/movies/42').expect(200).expect('X-Cache', 'MISS')
      await request(app).post('/catalog/movies').send({}).expect(200)

      expect(catalog.received).toHaveLength(3)
      expect(warn).not.toHaveBeenCalled()
      expect(error).not.toHaveBeenCalled()
    })

    it('never makes a response wait on a store or an increment', async () => {
      const app = buildGateway({ cacheStore: stalledStore })

      await request(app).get('/catalog/movies/42').expect(200).expect('X-Cache', 'MISS')
      await request(app).post('/catalog/movies').send({}).expect(200)
    })
  })
})
