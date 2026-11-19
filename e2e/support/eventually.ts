import { setTimeout as sleep } from 'node:timers/promises'

import { summarize, type ApiResponse } from './http'

export interface EventuallyOptions {
  readonly timeoutMs?: number
  readonly intervalMs?: number
}

/**
 * Repeats `request` until `done` accepts a response, and returns that response.
 *
 * For what the gateway's cache does after answering: it stores a miss once the
 * response is sent, and bumps a collection's generation without awaiting Redis.
 * With one replica the next request already sees either. Behind several
 * replicas (minikube), that request may reach Redis on another connection
 * before the command does. The bound keeps a missing effect a failure, and 5 s
 * is far below the cache TTL (30 s by default), so a stale entry cannot expire
 * into a pass.
 */
export async function eventually(
  request: () => Promise<ApiResponse>,
  done: (response: ApiResponse) => boolean,
  expectation: string,
  { timeoutMs = 5_000, intervalMs = 100 }: EventuallyOptions = {}
): Promise<ApiResponse> {
  const deadline = Date.now() + timeoutMs

  for (;;) {
    const response = await request()
    if (done(response)) return response

    if (Date.now() >= deadline) {
      throw new Error(
        `Timed out after ${timeoutMs} ms waiting for ${expectation}; ` +
          `last response: ${summarize(response)}`
      )
    }
    await sleep(intervalMs)
  }
}
