import { z } from 'zod'

import type { CachedResponse, ResponseCacheStore } from '../http/cache/responseCacheStore'
import type { RedisClient } from './createRedisClient'
import type { RedisAvailability } from './redisAvailability'

/**
 * The stored form: JSON, body in base64 so any bytes survive. `body` is not
 * checked as base64 here: that would run a regex over every hit, and
 * Buffer.from() never throws on it.
 */
const storedEntrySchema = z.object({
  status: z.number().int(),
  contentType: z.string(),
  body: z.string(),
})

/**
 * Response-cache storage on the shared client: GET, INCR and SET with a
 * millisecond TTL. One key per command, so each is a single round trip a
 * Cluster could route on its own.
 *
 * Each command's outcome is reported to `availability`, as the rate-limit
 * stores' are; it logs outages on transitions, and the cache stays silent.
 */
export function redisResponseCacheStore(
  client: RedisClient,
  availability: RedisAvailability
): ResponseCacheStore {
  return {
    async getGeneration(key) {
      const value = await availability.track(() => client.get(key))
      return value === null ? 0 : parseGeneration(value)
    },

    async incrementGeneration(key) {
      await availability.track(() => client.incr(key))
    },

    async getEntry(key) {
      const value = await availability.track(() => client.get(key))
      return value === null ? undefined : decodeEntry(value)
    },

    async setEntry(key, entry, ttlMs) {
      await availability.track(() =>
        client.set(key, encodeEntry(entry), { expiration: { type: 'PX', value: ttlMs } })
      )
    },
  }
}

function parseGeneration(value: string): number {
  const generation = Number(value)
  // Only INCR writes this key; anything else is not a generation to key by.
  if (!Number.isSafeInteger(generation)) throw new Error(`invalid cache generation "${value}"`)
  return generation
}

function encodeEntry({ status, contentType, body }: CachedResponse): string {
  return JSON.stringify({ status, contentType, body: body.toString('base64') })
}

/** Undefined, so a miss, for anything this format did not write. */
function decodeEntry(value: string): CachedResponse | undefined {
  let parsed: unknown
  try {
    parsed = JSON.parse(value)
  } catch {
    return undefined
  }

  const result = storedEntrySchema.safeParse(parsed)
  if (!result.success) return undefined

  const { status, contentType, body } = result.data
  return { status, contentType, body: Buffer.from(body, 'base64') }
}
