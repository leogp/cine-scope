export interface CredentialRoute {
  /** POST only: these endpoints take a password in the body. */
  readonly method: 'post'
  /**
   * A gateway path, prefix included. Matched like the access policy:
   * case-insensitive, trailing slash optional.
   */
  readonly path: `/${string}`
}

/**
 * Endpoints that accept a password, where every attempt is a guess an attacker
 * would like to repeat. On top of the global tier they get a much stricter
 * quota, shared by both and keyed by IP only, so presenting a token never buys
 * more attempts.
 *
 * Not listed, and so under the global tier only:
 * - /auth/refresh: refresh tokens are high-entropy and rotated with reuse
 *   detection, so they are not a guessing target;
 * - /auth/logout: it proves nothing.
 */
export const CREDENTIAL_ROUTES: readonly CredentialRoute[] = [
  { method: 'post', path: '/auth/login' },
  { method: 'post', path: '/auth/signup' },
]
