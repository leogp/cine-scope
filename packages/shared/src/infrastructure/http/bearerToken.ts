import jwt from 'jsonwebtoken'

import { AuthContext } from './authContext'

export interface AccessTokenOptions {
  secret: string
  issuer?: string
}

const BEARER_PREFIX = 'Bearer '

/**
 * Only string arrays survive; a claim of any other shape is treated as absent
 * rather than trusted, so a malformed token can never widen a caller's rights.
 */
const stringArrayClaim = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []

const toAuthContext = (payload: jwt.JwtPayload): AuthContext | null => {
  if (typeof payload.sub !== 'string' || payload.sub.length === 0) {
    return null
  }

  return {
    userId: payload.sub,
    username: typeof payload.username === 'string' ? payload.username : '',
    email: typeof payload.email === 'string' ? payload.email : '',
    roles: stringArrayClaim(payload.roles),
    permissions: stringArrayClaim(payload.permissions),
  }
}

/**
 * Resolves an `Authorization` header value to the caller it proves, or `null`
 * when it proves nothing: wrong scheme, a token that fails verification, or a
 * payload without a subject.
 *
 * Every failure collapses into the same `null` on purpose. Signature, expiry
 * and issuer failures must stay indistinguishable to the caller — the reason is
 * not theirs to learn — so no caller of this function is able to leak it.
 *
 * Deciding what an *absent* header means is left to the middleware: that is
 * the one point where `requireAuth` and `optionalAuth` differ.
 */
export function verifyBearerHeader(
  header: string,
  options: AccessTokenOptions
): AuthContext | null {
  if (!header.startsWith(BEARER_PREFIX)) {
    return null
  }

  const token = header.slice(BEARER_PREFIX.length).trim()

  let payload: string | jwt.JwtPayload

  try {
    payload = jwt.verify(token, options.secret, { issuer: options.issuer })
  } catch {
    return null
  }

  return typeof payload === 'string' ? null : toAuthContext(payload)
}
