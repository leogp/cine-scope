import { movieBody, seriesBody, type Relations } from './catalog'
import { SEED_USER } from './env'
import {
  uniqueName,
  type CatalogFixtures,
  type Fixtures,
  type RateLimitHeaders,
  type Session,
} from './fixtures'
import { api, createResource, ensureStatus, stringField, type ApiResponse } from './http'

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

  const seeded = sessionOf(seededLogin)

  return {
    runId,
    seeded,
    signedUp: sessionOf(signedUpLogin),
    credentialCalls: {
      login: rateLimitHeadersOf(seededLogin),
      signup: rateLimitHeadersOf(signup),
    },
    catalog: await createCatalog(runId, seeded.accessToken),
  }
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

function rateLimitHeadersOf(response: ApiResponse): RateLimitHeaders {
  return {
    rateLimit: response.headers.get('ratelimit'),
    rateLimitPolicy: response.headers.get('ratelimit-policy'),
  }
}

/** One resource behind every cacheable catalog route, linked the way a real movie is. */
async function createCatalog(runId: string, token: string): Promise<CatalogFixtures> {
  const genreId = await createResource('/catalog/genres', token, {
    name: uniqueName(runId, 'genre'),
  })
  const personId = await createResource('/catalog/people', token, {
    name: uniqueName(runId, 'person'),
  })
  const companyId = await createResource('/catalog/companies', token, {
    name: uniqueName(runId, 'company'),
  })

  const relations: Relations = {
    genreIds: [genreId],
    castIds: [personId],
    directorIds: [personId],
    companyIds: [companyId],
  }

  const seriesId = await createResource(
    '/catalog/series',
    token,
    seriesBody(uniqueName(runId, 'series'), relations)
  )
  const movieIds = [
    await createResource(
      '/catalog/movies',
      token,
      movieBody(uniqueName(runId, 'movie'), relations)
    ),
    await createResource(
      '/catalog/movies',
      token,
      movieBody(uniqueName(runId, 'movie'), relations)
    ),
  ] as const

  return { genreId, personId, companyId, seriesId, movieIds }
}
