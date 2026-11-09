import type { Application, RequestHandler } from 'express'
import request from 'supertest'

import { buildApp } from '@gateway/infrastructure/http/app'
import { buildResponseCache } from '@gateway/infrastructure/http/cache/buildResponseCache'
import type { RedisClient } from '@gateway/infrastructure/redis/createRedisClient'
import { RedisAvailability } from '@gateway/infrastructure/redis/redisAvailability'
import { redisResponseCacheStore } from '@gateway/infrastructure/redis/redisResponseCacheStore'
import { startStubService, type StubService } from './helpers/startStubService'
import { connectTestRedis, flushTestDatabase } from './helpers/testRedis'

// Not the production prefix, so these keys can never be taken for a running gateway's.
const KEY_PREFIX = 'int-test:cache:'
const TTL_MS = 60_000
const MAX_ENTRY_BYTES = 64 * 1024

// Authentication, rate limiting and authorization are not under test.
const passThrough: RequestHandler = (_req, _res, next) => next()

/**
 * Stores and INCRs are fire-and-forget, so a response can arrive before Redis
 * has applied them (the residual race). Wait for Redis to show the effect
 * instead of racing it.
 */
async function eventually(check: () => Promise<boolean>, timeoutMs = 1_000): Promise<void> {
  const deadline = Date.now() + timeoutMs
  while (!(await check())) {
    if (Date.now() > deadline) throw new Error(`condition not met within ${timeoutMs} ms`)
    await new Promise((resolve) => setTimeout(resolve, 10))
  }
}

describe('response caching across gateway replicas', () => {
  let catalog: StubService
  let admin: RedisClient
  let clients: RedisClient[]

  /** A replica with its own client and tracker, sharing the one Redis and the same prefix. */
  const replica = async (): Promise<Application> => {
    const availability = new RedisAvailability()
    const client = await connectTestRedis(availability)
    clients.push(client)

    return buildApp({
      routes: [{ prefix: '/catalog', target: catalog.url }],
      proxyTimeoutMs: 2_000,
      authenticate: passThrough,
      rateLimit: passThrough,
      authorize: passThrough,
      cache: buildResponseCache({
        store: redisResponseCacheStore(client, availability),
        ttlMs: TTL_MS,
        maxEntryBytes: MAX_ENTRY_BYTES,
        keyPrefix: KEY_PREFIX,
      }),
    })
  }

  const entryKeys = (): Promise<string[]> => admin.keys(`${KEY_PREFIX}v1:*`)

  beforeEach(async () => {
    // Each client logs one "available" line on connect; not under test here.
    jest.spyOn(console, 'info').mockImplementation(() => undefined)
    catalog = await startStubService('catalog-service', (received, res) => {
      res
        .status(received.method === 'POST' ? 201 : 200)
        .json({ url: received.url, call: catalog.received.length })
    })
    admin = await connectTestRedis()
    clients = [admin]
    await flushTestDatabase(admin)
  })

  afterEach(async () => {
    await Promise.all(clients.map((client) => client.close()))
    await catalog.close()
    jest.restoreAllMocks()
  })

  it('serves through one replica the response the other stored', async () => {
    const [a, b] = [await replica(), await replica()]

    const miss = await request(a)
      .get('/catalog/movies?pageSize=10&page=2')
      .expect(200)
      .expect('X-Cache', 'MISS')
    await eventually(async () => (await entryKeys()).length === 1)

    const hit = await request(b)
      .get('/catalog/movies?page=2&pageSize=10')
      .expect(200)
      .expect('X-Cache', 'HIT')

    expect(hit.text).toBe(miss.text)
    expect(catalog.received).toHaveLength(1)

    const [key] = await entryKeys()
    expect(key).toBe(`${KEY_PREFIX}v1:movies:0:GET:/catalog/movies?page=2&pageSize=10`)
    const ttl = await admin.pTTL(key)
    expect(ttl).toBeGreaterThan(0)
    expect(ttl).toBeLessThanOrEqual(TTL_MS)
  })

  it('misses on one replica after a 2xx write through the other', async () => {
    const [a, b] = [await replica(), await replica()]
    await request(a).get('/catalog/movies/42').expect('X-Cache', 'MISS')
    await eventually(async () => (await entryKeys()).length === 1)
    await request(b).get('/catalog/movies/42').expect('X-Cache', 'HIT')

    await request(a).post('/catalog/movies').send({}).expect(201)
    await eventually(async () => (await admin.get(`${KEY_PREFIX}gen:movies`)) === '1')

    await request(b).get('/catalog/movies/42').expect(200).expect('X-Cache', 'MISS')
    expect(catalog.received.map((received) => received.method)).toEqual(['GET', 'POST', 'GET'])
  })
})
