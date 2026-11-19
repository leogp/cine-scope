import { SEED_USER } from './env'
import type { Fixtures, Session } from './fixtures'
import { api, ensureStatus, stringField, type ApiResponse } from './http'

/** Meets auth-service's Password rules: 8+ characters, upper, lower, digit, special. */
const SIGNED_UP_PASSWORD = 'E2e-Passw0rd!'

interface Credentials {
  readonly email: string
  readonly password: string
}

/**
 * Spends exactly three requests of the gateway's credentials tier: the seeded
 * user's login, one signup, and the new user's login (signup answers with the
 * new id only, no tokens). No test makes another.
 */
export async function createFixtures(): Promise<Fixtures> {
  const runId = `e2e-${Date.now()}`

  const seededLogin = await logIn(SEED_USER, 'log in the seeded user')

  // The run id doubles as username: 17 characters, within auth-service's 20.
  const newUser = {
    username: runId,
    email: `${runId}@e2e.cinescope.test`,
    password: SIGNED_UP_PASSWORD,
    name: `${runId} signed-up user`,
  }
  const signup = await api('/auth/signup', { method: 'POST', body: newUser })
  ensureStatus(signup, 201, 'sign up a new user')

  const signedUpLogin = await logIn(newUser, 'log in the signed-up user')

  return { runId, seeded: sessionOf(seededLogin), signedUp: sessionOf(signedUpLogin) }
}

async function logIn({ email, password }: Credentials, action: string): Promise<ApiResponse> {
  const response = await api('/auth/login', { method: 'POST', body: { email, password } })
  ensureStatus(response, 200, action)
  return response
}

function sessionOf(login: ApiResponse): Session {
  return {
    accessToken: stringField(login.body, 'accessToken'),
    refreshToken: stringField(login.body, 'refreshToken'),
  }
}
