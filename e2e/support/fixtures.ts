import { randomUUID } from 'node:crypto'

/** The environment variable globalSetup hands the fixtures over in, as JSON. */
export const FIXTURES_ENV = 'E2E_FIXTURES'

export interface Session {
  readonly accessToken: string
  readonly refreshToken: string
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
