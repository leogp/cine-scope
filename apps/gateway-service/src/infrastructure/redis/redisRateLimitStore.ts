import type { Store } from 'express-rate-limit'
import { RedisStore, type RedisReply } from 'rate-limit-redis'

import type { RedisClient } from './createRedisClient'
import type { RedisAvailability } from './redisAvailability'

/**
 * Rate-limit stores backed by the shared client, one per tier (express-rate-limit
 * refuses to share a store between limiters), told apart by key prefix. Every
 * replica builds its stores with the same prefixes and so counts into the same
 * keys, which is what makes a limit hold across replicas.
 *
 * Each command's outcome is reported to `availability`, which logs outages on
 * transitions; the limiter itself stays silent about store failures.
 */
export function redisStoreFactory(
  client: RedisClient,
  availability: RedisAvailability
): (prefix: string) => Store {
  return (prefix) =>
    new RedisStore({
      prefix,
      sendCommand: (...args: string[]) =>
        availability.track(() => client.sendCommand<RedisReply>(args)),
    })
}
