import { movieBody } from '../support/catalog'
import { readFixtures, uniqueName } from '../support/fixtures'
import { api, stringField } from '../support/http'

const { runId, seeded, signedUp } = readFixtures()

describe('access token contract', () => {
  // One request proves the chain: the gateway verifies auth-service's token
  // (shared secret, issuer, claim shape), finds the permission ACCESS_POLICY
  // names among its claims, and catalog verifies it again with its own guard.
  it('lets the seeded user create a movie with the token auth-service issued', async () => {
    const response = await api('/catalog/movies', {
      method: 'POST',
      token: seeded.accessToken,
      body: movieBody(uniqueName(runId, 'token-contract')),
    })

    expect(response.status).toBe(201)
    expect(response.body).toEqual({ id: expect.any(String) })
  })
})

describe('access policy with real users', () => {
  it('refuses an anonymous write with 401', async () => {
    const response = await api('/catalog/movies', {
      method: 'POST',
      body: movieBody(uniqueName(runId, 'anonymous')),
    })

    expect(response.status).toBe(401)
  })

  // 403, not 401: the token is accepted; the default role lacks catalog:write.
  it('refuses a signed-up user, whose default role lacks catalog:write, with 403', async () => {
    const response = await api('/catalog/movies', {
      method: 'POST',
      token: signedUp.accessToken,
      body: movieBody(uniqueName(runId, 'forbidden')),
    })

    expect(response.status).toBe(403)
  })

  // Refresh builds its claims in its own use case, apart from login's, so a
  // working refreshed token is a separate check of the claim shape.
  it('refreshes a token through the gateway into one that can write', async () => {
    const refreshed = await api('/auth/refresh', {
      method: 'POST',
      body: { refreshToken: seeded.refreshToken },
    })
    expect(refreshed.status).toBe(200)

    const created = await api('/catalog/genres', {
      method: 'POST',
      token: stringField(refreshed.body, 'accessToken'),
      body: { name: uniqueName(runId, 'refreshed') },
    })
    expect(created.status).toBe(201)
  })
})
