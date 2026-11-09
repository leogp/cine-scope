import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),

  // Targets are injected per environment (docker-compose sets all five); the
  // routing table itself is static and lives in code.
  AUTH_SERVICE_URL: z.url(),
  CATALOG_SERVICE_URL: z.url(),
  RECOMMENDATION_SERVICE_URL: z.url(),
  REVIEW_SERVICE_URL: z.url(),
  WATCHLIST_SERVICE_URL: z.url(),

  // Shared with auth-service, which signs the access tokens the gateway verifies
  // (catalog-service verifies them again with the same key). Required, not
  // optional: without it the gateway could not tell a valid token from a forged one.
  JWT_ACCESS_SECRET: z.string().min(16),

  // http-proxy applies no timeout by default: a downstream service that accepts
  // the connection and then never answers would pin the client socket open for
  // as long as the kernel allows.
  PROXY_TIMEOUT_MS: z.coerce.number().int().positive().default(30_000),
  // Rate-limit counters and cached responses live in Redis so that limits and
  // cache invalidations hold across gateway replicas. Required: the gateway
  // starts, and fails open, while Redis is unreachable, but it must know where
  // Redis is.
  REDIS_URL: z.url({ protocol: /^rediss?$/ }),

  // Upper bound on every Redis command. Each request waits on the limiter, and
  // each cacheable read on two cache lookups; both fail open, so a slow Redis
  // must fail fast rather than add its latency to every call. A healthy Redis
  // on the same network answers in well under a millisecond.
  REDIS_COMMAND_TIMEOUT_MS: z.coerce.number().int().positive().default(200),

  // Global tier: every request past authentication, keyed by user when a valid
  // token is presented and by client IP otherwise. 300 a minute is 5/s
  // sustained, room for pages that fan out and for several users behind a NAT.
  RATE_LIMIT_GLOBAL_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  RATE_LIMIT_GLOBAL_MAX: z.coerce.number().int().positive().default(300),

  // Credentials tier: POST /auth/login and /auth/signup, keyed by IP only and
  // shared by the two. 10 per 15 minutes covers a few typos and a couple of
  // people behind one address, and caps password guessing at 40 an hour per IP.
  // Refresh is deliberately absent: refresh tokens are high-entropy and rotated
  // with reuse detection, so they are not a guessing target. The routes live in
  // credentialRoutes.ts.
  RATE_LIMIT_CREDENTIALS_WINDOW_MS: z.coerce.number().int().positive().default(900_000),
  RATE_LIMIT_CREDENTIALS_MAX: z.coerce.number().int().positive().default(10),

  // Response cache for public catalog reads (infrastructure/http/cache). Writes
  // through the gateway invalidate at once, so the TTL bounds staleness only
  // where invalidation cannot reach: a failed INCR, the residual race after a
  // write, a change made to catalog's database directly. 30 s keeps that bound
  // short while a popular key still costs catalog about two calls a minute.
  CACHE_TTL_MS: z.coerce.number().int().positive().default(30_000),

  // Largest body stored, in bytes; a larger one is still served, only not
  // stored. Every miss buffers up to this much while it is proxied, so it is a
  // memory bound too. Estimated sizes: a movie list page is about 80–140 KiB at
  // 100 items, since summaries omit relations and pageSize is capped at 100. A
  // movie detail with 60 cast members and 4,000-character biographies is about
  // 250 KiB. Only extreme casts exceed 512 KiB, and those are served uncached.
  CACHE_MAX_ENTRY_BYTES: z.coerce.number().int().positive().default(524_288),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error(`Invalid environment variables:\n${z.prettifyError(parsed.error)}`)
  process.exit(1)
}

export const env = Object.freeze(parsed.data)

export type Env = z.infer<typeof envSchema>
