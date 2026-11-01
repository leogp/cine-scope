import type { Application, RequestHandler } from 'express'
import { MemoryStore } from 'express-rate-limit'
import request from 'supertest'

import { buildApp } from '@gateway/infrastructure/http/app'
import {
  buildRateLimit,
  type StoreFactory,
} from '@gateway/infrastructure/http/rateLimit/buildRateLimit'
import type { RedisClient } from '@gateway/infrastructure/redis/createRedisClient'
import { RedisAvailability } from '@gateway/infrastructure/redis/redisAvailability'
import { redisStoreFactory } from '@gateway/infrastructure/redis/redisRateLimitStore'
import { startStubService, type StubService } from './helpers/startStubService'
import { connectTestRedis, flushTestDatabase } from './helpers/testRedis'

const LIMIT = 3
// Far longer than the suite: a window that reset mid-test would let a request
// through and fail the assertion for the wrong reason.
const WINDOW_MS = 10 * 60_000

// Authentication and authorization are not under test; every request is anonymous.
const passThrough: RequestHandler = (_req, _res, next) => next()

describe('rate limiting across gateway replicas', () => {
  let catalog: StubService
  let admin: RedisClient
  let clients: RedisClient[]

  /** One gateway "replica": its own limiter, its own stores. */
  const buildReplica = (createStore: StoreFactory): Application =>
    buildApp({
      routes: [{ prefix: '/catalog', target: catalog.url }],
      proxyTimeoutMs: 2_000,
      authenticate: passThrough,
      rateLimit: buildRateLimit({
        global: { windowMs: WINDOW_MS, limit: LIMIT },
        credentials: { windowMs: WINDOW_MS, limit: LIMIT },
        createStore,
      }),
      authorize: passThrough,
    })

  /** A replica with its own client and tracker, sharing the one Redis and the same prefixes. */
  const redisReplica = async (): Promise<Application> => {
    const availability = new RedisAvailability()
    const client = await connectTestRedis(availability)
    clients.push(client)
    return buildReplica(redisStoreFactory(client, availability))
  }

  beforeEach(async () => {
    // Each client logs one "available" line on connect; not under test here.
    jest.spyOn(console, 'info').mockImplementation(() => undefined)
    catalog = await startStubService('catalog-service')
    admin = await connectTestRedis()
    clients = [admin]
    await flushTestDatabase(admin)
  })

  afterEach(async () => {
    await Promise.all(clients.map((client) => client.close()))
    await catalog.close()
    jest.restoreAllMocks()
  })

  it('holds one limit across two replicas sharing Redis', async () => {
    const replicas = [await redisReplica(), await redisReplica()]

    for (let i = 0; i < LIMIT; i++) {
      await request(replicas[i % 2])
        .get('/catalog/movies')
        .expect(200)
    }

    await request(replicas[0]).get('/catalog/movies').expect(429)
    await request(replicas[1]).get('/catalog/movies').expect(429)
    expect(catalog.received).toHaveLength(LIMIT)
    // Both replicas counted into the one prefixed key.
    expect(await admin.exists('rl:global:ip:127.0.0.1')).toBe(1)
  })

  // Contrast: why Redis. Each in-memory replica counts alone.
  it('lets twice the limit through when each replica keeps its own count', async () => {
    const replicas = [buildReplica(() => new MemoryStore()), buildReplica(() => new MemoryStore())]

    for (let i = 0; i < 2 * LIMIT; i++) {
      await request(replicas[i % 2])
        .get('/catalog/movies')
        .expect(200)
    }

    await request(replicas[0]).get('/catalog/movies').expect(429)
    await request(replicas[1]).get('/catalog/movies').expect(429)
    expect(catalog.received).toHaveLength(2 * LIMIT)
  })
})
