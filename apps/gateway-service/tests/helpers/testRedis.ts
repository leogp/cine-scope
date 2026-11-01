import {
  createRedisClient,
  type RedisClient,
} from '@gateway/infrastructure/redis/createRedisClient'
import { RedisAvailability } from '@gateway/infrastructure/redis/redisAvailability'

/** Logical database reserved for the integration suites; the gateway itself uses 0. */
const TEST_DATABASE = 15

/**
 * Redis client for integration tests, wired like the composition root's but
 * guarded so the suite can never flush a non-test database.
 */
export async function connectTestRedis(
  availability: RedisAvailability = new RedisAvailability()
): Promise<RedisClient> {
  const url = process.env.REDIS_URL ?? ''

  if (databaseOf(url) !== TEST_DATABASE) {
    throw new Error(
      `Refusing to run integration tests against "${url}" — expected a Redis URL naming database ${TEST_DATABASE}`
    )
  }

  // Generous: CI runners are slower than the gateway's 200 ms production budget.
  const client = createRedisClient({ url, commandTimeoutMs: 2_000, availability })
  await client.connect()
  return client
}

/**
 * FLUSHDB only after asking the server which database this connection selected.
 * The URL check above trusts whoever built the client; this one does not.
 */
export async function flushTestDatabase(client: RedisClient): Promise<void> {
  const info = String(await client.sendCommand(['CLIENT', 'INFO']))
  const selected = /\bdb=(\d+)\b/.exec(info)?.[1]

  if (selected !== String(TEST_DATABASE)) {
    throw new Error(
      `Refusing to flush Redis database ${selected ?? '?'} — expected ${TEST_DATABASE}`
    )
  }

  await client.flushDb()
}

function databaseOf(url: string): number | undefined {
  if (!URL.canParse(url)) return undefined
  const path = new URL(url).pathname.slice(1)
  return /^\d+$/.test(path) ? Number(path) : undefined
}
