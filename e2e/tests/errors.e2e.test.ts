import { randomUUID } from 'node:crypto'

import { readFixtures } from '../support/fixtures'
import { api, isRecord, type ApiResponse } from '../support/http'

const { runId } = readFixtures()

/**
 * The envelope of @cinescope/shared's error and 404 handlers: a string `error`,
 * plus a string `message` (service errors) or `path` (unmatched routes).
 *
 * Deliberately loose: it documents the current divergence rather than a single
 * shape. The gateway's 404 is `{ error: 'NotFound', path }`, catalog's
 * `{ error: 'MovieNotFoundError', message }`, and `error` mixes reason phrases
 * with internal class names. `chore/error-envelope` (docs/roadmap.md) settles one
 * shape, a stable `error` code plus `message`, and tightens this check to match.
 */
function expectErrorEnvelope(response: ApiResponse): void {
  expect(response.headers.get('content-type')).toMatch(/^application\/json\b/)
  expect(isRecord(response.body)).toBe(true)

  const { error, ...rest } = response.body as Record<string, unknown>
  expect(error).toEqual(expect.any(String))
  for (const [key, value] of Object.entries(rest)) {
    expect([key, typeof value]).toEqual([expect.stringMatching(/^(message|path)$/), 'string'])
  }
}

describe('error envelope', () => {
  it('is shared by a gateway 404 and a catalog 404', async () => {
    const fromGateway = await api(`/${runId}-no-such-prefix`)
    const fromCatalog = await api(`/catalog/movies/${randomUUID()}`)

    expect(fromGateway.status).toBe(404)
    expect(fromCatalog.status).toBe(404)
    expectErrorEnvelope(fromGateway)
    expectErrorEnvelope(fromCatalog)
  })
})
