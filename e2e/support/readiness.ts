import { setTimeout as sleep } from 'node:timers/promises'

import { BASE_URL, READY_TIMEOUT_MS } from './env'
import { api } from './http'
import { PROXIED_SERVICES } from './services'

/** The gateway's own health first, then each service's through the gateway. */
const HEALTH_PATHS: readonly string[] = [
  '/health',
  ...PROXIED_SERVICES.map(({ prefix }) => `${prefix}/health`),
]

/**
 * Probes under a proxied prefix count against the gateway's global rate-limit
 * tier (anonymous, so keyed by IP: 300 a minute by default). At most five every
 * 2 s stays far inside it, even through a long wait.
 */
const POLL_INTERVAL_MS = 2_000
const PROBE_TIMEOUT_MS = 2_000

/**
 * Resolves once every path in HEALTH_PATHS answers 200. Services are probed
 * through the gateway because Compose starts it without waiting for them
 * (`service_started`): until one is listening, its prefix answers 502. Only the
 * paths still failing are probed again. Throws after READY_TIMEOUT_MS, naming
 * each failing path and its last reason.
 */
export async function waitForStack(): Promise<void> {
  const deadline = Date.now() + READY_TIMEOUT_MS
  const failing = new Map<string, string>(HEALTH_PATHS.map((path) => [path, 'not probed']))

  for (;;) {
    for (const path of [...failing.keys()]) {
      const failure = await probe(path)
      if (failure === undefined) failing.delete(path)
      else failing.set(path, failure)
    }
    if (failing.size === 0) return

    if (Date.now() >= deadline) {
      throw new Error(
        [
          `The stack behind ${BASE_URL} was not ready after ${READY_TIMEOUT_MS} ms:`,
          ...[...failing].map(([path, failure]) => `  GET ${path}: ${failure}`),
          'Is it running (docker compose up), and does E2E_BASE_URL point at the gateway?',
        ].join('\n')
      )
    }
    await sleep(POLL_INTERVAL_MS)
  }
}

/** undefined when healthy, otherwise why not. */
async function probe(path: string): Promise<string | undefined> {
  try {
    const response = await api(path, { timeoutMs: PROBE_TIMEOUT_MS })
    return response.status === 200 ? undefined : `HTTP ${response.status}`
  } catch (error) {
    return reasonOf(error)
  }
}

/** fetch rejects with a bare "fetch failed"; the cause (ECONNREFUSED, ENOTFOUND, …) is what helps. */
function reasonOf(error: unknown): string {
  if (!(error instanceof Error)) return String(error)
  return error.cause instanceof Error ? `${error.message}: ${error.cause.message}` : error.message
}
