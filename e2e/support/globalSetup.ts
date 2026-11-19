import { createFixtures } from './createFixtures'
import { FIXTURES_ENV } from './fixtures'
import { waitForStack } from './readiness'

/**
 * Runs once per run, before any test file: waits for the stack, then creates
 * the shared fixtures.
 *
 * Fixtures travel through the environment. Jest gives each test file its own
 * module registry and keeps globals set here away from tests, but process.env is
 * inherited: by test files run in band, and by any worker forked after this.
 */
export default async function globalSetup(): Promise<void> {
  await waitForStack()
  process.env[FIXTURES_ENV] = JSON.stringify(await createFixtures())
}
