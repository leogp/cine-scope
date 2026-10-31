import { Router, type Request, type RequestHandler } from 'express'
import { ipKeyGenerator, rateLimit, type Logger, type Store } from 'express-rate-limit'

import { CREDENTIAL_ROUTES } from './credentialRoutes'

export interface RateLimitTier {
  readonly windowMs: number
  readonly limit: number
}

/** Must return a new store on every call: one per tier. */
export type StoreFactory = (prefix: string) => Store

export interface RateLimitConfig {
  readonly global: RateLimitTier
  readonly credentials: RateLimitTier
  readonly createStore: StoreFactory
}

type TierName = 'global' | 'credentials'

// Providers hand a single subscriber a whole /64, so keying on the full IPv6
// address would let one client rotate through 2^64 quotas.
const IPV6_PREFIX_LENGTH = 64

const TOO_MANY_REQUESTS = {
  error: 'TooManyRequests',
  message: 'Too many requests, retry after the number of seconds in Retry-After',
} as const

/**
 * express-rate-limit reports store failures through `logger.error`, once per
 * request and per tier. They are not logged here: the store's owner reports
 * availability on state transitions (infrastructure/redis/redisAvailability.ts),
 * which is the signal an operator needs. What remains is the library's own
 * configuration checks (codes ERR_ERL_*, deprecations on `warn`): bugs in this
 * file, logged as such.
 */
const logger: Logger = {
  warn: (error) => console.warn('[gateway] rate limit:', error),
  error: (error) => {
    if (isLibraryCheck(error)) console.error('[gateway] rate limit:', error)
  },
}

/**
 * `ip:<address>`, IPv6 reduced to its /64 (and v4-mapped IPv6 to plain IPv4).
 * `req.ip` is the socket address: `trust proxy` is off and forwarding headers
 * are stripped, so it is the only client address the gateway can trust.
 */
export const clientIpKey = (req: Request): string =>
  `ip:${ipKeyGenerator(req.ip ?? 'unknown', IPV6_PREFIX_LENGTH)}`

/** `user:<id>` for an identified caller, the client IP for everyone else. */
export const callerKey = (req: Request): string =>
  req.auth ? `user:${req.auth.userId}` : clientIpKey(req)

/**
 * The gateway's two rate-limit tiers, as one middleware:
 *
 * - global: every request, keyed by `callerKey`;
 * - credentials: CREDENTIAL_ROUTES only, keyed by `clientIpKey`, on top of the
 *   global tier (a login counts against both).
 *
 * Each tier has its own store and key prefix (`rl:global:`, `rl:credentials:`),
 * and every replica uses the same prefixes, so a Redis-backed limit holds
 * across replicas.
 *
 * Algorithm: fixed window. The first hit starts a window of `windowMs` for that
 * key; hits are counted until it expires. Known trade-off: a client can send
 * close to twice the limit across a window boundary (a full quota at the end of
 * one window, another at the start of the next). At these limits that burst is
 * accepted, in exchange for one atomic Redis round trip per tier and request.
 *
 * Fail open: if the store errors or times out, the request passes unlimited.
 * An outage of the limiter must not become an outage of the gateway.
 */
export function buildRateLimit({
  global,
  credentials,
  createStore,
}: RateLimitConfig): RequestHandler {
  const limiter = Router()

  limiter.use(buildTier('global', global, callerKey, createStore))

  const credentialsTier = buildTier('credentials', credentials, clientIpKey, createStore)
  for (const route of CREDENTIAL_ROUTES) {
    limiter[route.method](route.path, credentialsTier)
  }

  return limiter
}

function buildTier(
  name: TierName,
  { windowMs, limit }: RateLimitTier,
  keyGenerator: (req: Request) => string,
  createStore: StoreFactory
): RequestHandler {
  return rateLimit({
    windowMs,
    limit,
    keyGenerator,
    store: createStore(`rl:${name}:`),
    // `RateLimit` / `RateLimit-Policy`, one named entry per tier, and Retry-After
    // on a 429. No X-RateLimit-* headers.
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    identifier: name,
    passOnStoreError: true,
    logger,
    // The envelope @cinescope/shared's error handlers and the proxy use.
    handler: (_req, res, _next, options) => {
      res.status(options.statusCode).json(TOO_MANY_REQUESTS)
    },
  })
}

function isLibraryCheck(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof error.code === 'string' &&
    error.code.startsWith('ERR_ERL_')
  )
}
