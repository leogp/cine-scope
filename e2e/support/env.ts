/**
 * The suite's inputs, all from the environment. Pointing it at another
 * deployment (minikube) changes E2E_BASE_URL only.
 */

/** The gateway's published port on the host (docker-compose.yml). */
const DEFAULT_BASE_URL = 'http://localhost:4000'

/** The gateway's origin, with any path prefix kept and trailing slashes removed. */
export const BASE_URL = baseUrl(process.env.E2E_BASE_URL ?? DEFAULT_BASE_URL)

/**
 * auth-service's seeded user (apps/auth-service/src/infrastructure/prisma/seed.ts),
 * which holds the admin role and therefore `catalog:write`. The password is the
 * seed's development fallback; if the seed ran with SEED_USER_PASSWORD, pass the
 * same value as E2E_SEED_PASSWORD.
 */
export const SEED_USER: Readonly<{ email: string; password: string }> = {
  email: 'lpuglisi@some.domain.com',
  password: process.env.E2E_SEED_PASSWORD ?? 'ChangeMe123!',
}

/** Upper bound on the readiness wait before any test runs. */
export const READY_TIMEOUT_MS = positiveInteger('E2E_READY_TIMEOUT_MS', 120_000)

function baseUrl(raw: string): string {
  // Throws on a malformed value here rather than on the first request.
  new URL(raw)
  return raw.replace(/\/+$/, '')
}

function positiveInteger(name: string, fallback: number): number {
  const raw = process.env[name]
  if (raw === undefined) return fallback

  const value = Number(raw)
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer, got "${raw}"`)
  }
  return value
}
