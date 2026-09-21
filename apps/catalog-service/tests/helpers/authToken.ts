import { CATALOG_WRITE } from '@catalog/infrastructure/http/permissions'
import jwt from 'jsonwebtoken'

export const TEST_JWT_SECRET = 'test-access-secret-0123456789'
export const TEST_JWT_ISSUER = 'auth-service'

interface TokenOverrides {
  roles?: string[]
  permissions?: string[]
  subject?: string
  secret?: string
  issuer?: string
  expiresIn?: jwt.SignOptions['expiresIn']
}

/**
 * Mints a real access token in the shape auth-service signs, rather than stubbing
 * the guard: the HTTP suites then exercise the production middleware chain, so a
 * change to either side of the contract shows up as a failing test.
 */
export const signAccessToken = ({
  roles = ['editor'],
  permissions = [CATALOG_WRITE],
  subject = 'user-1',
  secret = TEST_JWT_SECRET,
  issuer = TEST_JWT_ISSUER,
  expiresIn = '15m',
}: TokenOverrides = {}): string =>
  jwt.sign(
    { sub: subject, username: 'leo_dev', email: 'leo@example.com', roles, permissions },
    secret,
    { issuer, expiresIn }
  )

/** `Authorization` header value for a caller holding `catalog:write` by default. */
export const authHeader = (overrides: TokenOverrides = {}): string =>
  `Bearer ${signAccessToken(overrides)}`
