import { createClient } from 'redis'

import type { RedisAvailability } from './redisAvailability'

export interface RedisClientConfig {
  readonly url: string
  readonly commandTimeoutMs: number
  /** Told about every connection state change; it decides what is worth logging. */
  readonly availability: RedisAvailability
}

// A refused connection fails at once; this bounds the other kind, a host that
// never answers, so reconnect attempts stay frequent.
const CONNECT_TIMEOUT_MS = 2_000
const MAX_RECONNECT_DELAY_MS = 2_000

// The client type is derived from the options actually passed rather than
// spelled out: node-redis 6 infers RESP 3 and the empty module/script maps
// from them, and its wide `ReturnType<typeof createClient>` (RESP 2 | 3) is
// not assignable from that.
const buildClient = (url: string, commandTimeoutMs: number) =>
  createClient({
    url,
    disableOfflineQueue: true,
    commandOptions: { timeout: commandTimeoutMs },
    socket: {
      connectTimeout: CONNECT_TIMEOUT_MS,
      reconnectStrategy: (retries: number) => Math.min(2 ** retries * 50, MAX_RECONNECT_DELAY_MS),
    },
  })

export type RedisClient = ReturnType<typeof buildClient>

/**
 * The gateway's Redis client, tuned for a caller that fails open:
 *
 * - `disableOfflineQueue`: while disconnected, commands reject at once
 *   (ClientOfflineError) instead of queueing until Redis returns. A queued
 *   command is a request left waiting.
 * - `commandOptions.timeout`: a connected but slow Redis is bounded too.
 * - `reconnectStrategy`: exponential backoff capped at 2 s, never giving up,
 *   so Redis coming back is picked up without a restart.
 *
 * Returned unconnected: the composition root decides how long startup waits.
 */
export function createRedisClient({
  url,
  commandTimeoutMs,
  availability,
}: RedisClientConfig): RedisClient {
  const client = buildClient(url, commandTimeoutMs)

  // Required: node-redis emits `error` on every failed (re)connect, and an
  // EventEmitter with no `error` listener throws, crashing the process. It
  // reports rather than logs, so an outage retried every 2 s yields one warning.
  client.on('error', (err: Error) => availability.markUnavailable(err))
  client.on('ready', () => availability.markAvailable())

  return client
}

/**
 * Resolves `true` on the client's `ready` event, or `false` once `timeoutMs`
 * passes without it. Never rejects: unlike `events.once`, it is not cut short
 * by the `error` events that failed connection attempts emit.
 *
 * Call it before `connect()` so `ready` cannot fire unobserved.
 */
export function waitUntilReady(client: RedisClient, timeoutMs: number): Promise<boolean> {
  if (client.isReady) return Promise.resolve(true)

  return new Promise((resolve) => {
    const onReady = (): void => {
      clearTimeout(timer)
      resolve(true)
    }
    const timer = setTimeout(() => {
      client.off('ready', onReady)
      resolve(false)
    }, timeoutMs)

    client.once('ready', onReady)
  })
}
