import { randomUUID } from 'node:crypto'

/** The environment variable globalSetup hands the fixtures over in, as JSON. */
export const FIXTURES_ENV = 'E2E_FIXTURES'

export interface Session {
  readonly accessToken: string
  readonly refreshToken: string
}

/** The draft-8 rate-limit headers of one response, as received. */
export interface RateLimitHeaders {
  readonly rateLimit: string | null
  readonly rateLimitPolicy: string | null
}

/** Created once per run, through the gateway, by the seeded user. */
export interface CatalogFixtures {
  readonly genreId: string
  readonly personId: string
  readonly companyId: string
  readonly seriesId: string
  /** Two, so a list page of two movies always exists. */
  readonly movieIds: readonly [string, string]
}

export interface Fixtures {
  /** `e2e-<epoch ms>`: prefixes every value this run creates. */
  readonly runId: string
  /**
   * auth-service's seeded user: admin role, so `catalog:write`. Its refresh
   * token is single use (rotated on refresh): only the refresh test presents it.
   */
  readonly seeded: Session
  /** Signed up by this run, so it holds the default `user` role only: no `catalog:write`. */
  readonly signedUp: Session
  /**
   * Rate-limit headers of the setup's own credential calls, so the credentials
   * tier is checked without spending more of it.
   */
  readonly credentialCalls: { readonly login: RateLimitHeaders; readonly signup: RateLimitHeaders }
  readonly catalog: CatalogFixtures
}

export function readFixtures(): Fixtures {
  const raw = process.env[FIXTURES_ENV]
  if (raw === undefined) {
    throw new Error(
      `${FIXTURES_ENV} is not set: run the suite with "npm run test:e2e -w e2e", ` +
        'whose globalSetup creates the fixtures'
    )
  }
  return JSON.parse(raw) as Fixtures
}

/** `<runId>-<label>-<8 hex>`: recognisable per run, unique even for repeated labels. */
export function uniqueName(runId: string, label: string): string {
  return `${runId}-${label}-${randomUUID().slice(0, 8)}`
}
