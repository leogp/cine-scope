import 'dotenv/config'
import { buildOptionalAuth } from '@cinescope/shared/infrastructure/http'
import { env } from './config/env'
import { buildApp } from './infrastructure/http/app'
import { ACCESS_POLICY } from './infrastructure/http/authorization/accessPolicy'
import { buildAuthorization } from './infrastructure/http/authorization/buildAuthorization'
import { buildRouteTable } from './infrastructure/http/proxy/routeTable'
import { buildRateLimit } from './infrastructure/http/rateLimit/buildRateLimit'
import { createRedisClient, waitUntilReady } from './infrastructure/redis/createRedisClient'
import { RedisAvailability } from './infrastructure/redis/redisAvailability'
import { redisStoreFactory } from './infrastructure/redis/redisRateLimitStore'

// Upper bound on waiting for Redis at startup. Compose starts the gateway only
// once Redis reports healthy, so a normal boot is ready within milliseconds; the
// bound matters only when Redis is missing, and 5 s keeps that short.
const REDIS_READY_TIMEOUT_MS = 5_000

async function main(): Promise<void> {
  const routes = buildRouteTable(env)

  // One client for every Redis-backed feature; gateway/cache will share it.
  const redisAvailability = new RedisAvailability()
  const redis = createRedisClient({
    url: env.REDIS_URL,
    commandTimeoutMs: env.REDIS_COMMAND_TIMEOUT_MS,
    availability: redisAvailability,
  })

  const ready = waitUntilReady(redis, REDIS_READY_TIMEOUT_MS)
  // Connects in the background, retrying until Redis answers. The promise
  // settles once ready and rejects only if the client is closed first.
  redis
    .connect()
    .catch((err: unknown) => console.error('[gateway] redis: closed before connecting', err))

  // The limiters are built after the wait, so their stores upload their Lua
  // scripts to a Redis that is ready.
  if (!(await ready)) {
    // Fail-open mode: traffic passes unlimited until Redis answers. The stores
    // then reload their scripts (rate-limit-redis >= 6.0.2) and limiting
    // resumes without a restart. No-op if a connection error already warned.
    redisAvailability.markUnavailable(
      new Error(`not ready within ${REDIS_READY_TIMEOUT_MS} ms, starting without it`)
    )
  }

  const app = buildApp({
    routes,
    proxyTimeoutMs: env.PROXY_TIMEOUT_MS,
    // Issuer pinned, as in catalog-service: a token minted by any other service in
    // the platform cannot stand in for one from auth-service.
    authenticate: buildOptionalAuth({
      secret: env.JWT_ACCESS_SECRET,
      issuer: 'auth-service',
    }),
    rateLimit: buildRateLimit({
      global: {
        windowMs: env.RATE_LIMIT_GLOBAL_WINDOW_MS,
        limit: env.RATE_LIMIT_GLOBAL_MAX,
      },
      credentials: {
        windowMs: env.RATE_LIMIT_CREDENTIALS_WINDOW_MS,
        limit: env.RATE_LIMIT_CREDENTIALS_MAX,
      },
      createStore: redisStoreFactory(redis, redisAvailability),
    }),
    // Throws at startup if the policy names a prefix the route table lacks.
    authorize: buildAuthorization({ policy: ACCESS_POLICY, routes }),
  })

  app.listen(env.PORT, () => console.log(`gateway-service running on port ${env.PORT}`))
}

main().catch((err: unknown) => {
  console.error(err)
  process.exit(1)
})
