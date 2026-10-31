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
  // Rate-limit counters live in Redis so that a limit holds across gateway
  // replicas. Required: the gateway starts, and fails open, while Redis is
  // unreachable, but it must know where Redis is.
  REDIS_URL: z.url({ protocol: /^rediss?$/ }),

  // Upper bound on every Redis command. Each request waits on the limiter and
  // the limiter fails open, so a slow Redis must fail fast rather than add its
  // latency to every call; a healthy Redis on the same network answers in well
  // under a millisecond.
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
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error(`Invalid environment variables:\n${z.prettifyError(parsed.error)}`)
  process.exit(1)
}

export const env = Object.freeze(parsed.data)

export type Env = z.infer<typeof envSchema>
