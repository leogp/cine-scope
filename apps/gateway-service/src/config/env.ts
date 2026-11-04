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
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error(`Invalid environment variables:\n${z.prettifyError(parsed.error)}`)
  process.exit(1)
}

export const env = Object.freeze(parsed.data)

export type Env = z.infer<typeof envSchema>
