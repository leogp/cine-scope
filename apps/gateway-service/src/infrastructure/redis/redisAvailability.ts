import { ErrorReply } from 'redis'

type State = 'unknown' | 'available' | 'unavailable'

/**
 * Whether Redis is answering, logged on state transitions only: one warning
 * when it starts failing, one line when it is available again.
 *
 * Fed by the client's connection events and by the outcome of every rate-limit
 * command, so a Redis that is connected but timing out counts as failing too.
 * Never per request and never per tier: during an outage every request fails
 * open in both tiers, and a line for each would bury everything else.
 */
export class RedisAvailability {
  #state: State = 'unknown'

  markAvailable(): void {
    if (this.#state === 'available') return
    this.#state = 'available'
    console.info('[gateway] redis: available, rate limiting enforced')
  }

  markUnavailable(reason: unknown): void {
    if (this.#state === 'unavailable') return
    this.#state = 'unavailable'
    console.warn(
      `[gateway] redis: unavailable (${describe(reason)}), rate limiting fails open until it recovers`
    )
  }

  /**
   * Runs a command and records what its outcome says about Redis. An error
   * *reply* (NOSCRIPT, WRONGTYPE…) is Redis answering, so it counts as
   * available; anything else (offline, timeout, closed socket) does not.
   * The outcome is passed through unchanged.
   */
  async track<T>(command: () => Promise<T>): Promise<T> {
    try {
      const reply = await command()
      this.markAvailable()
      return reply
    } catch (error) {
      if (error instanceof ErrorReply) this.markAvailable()
      else this.markUnavailable(error)
      throw error
    }
  }
}

function describe(reason: unknown): string {
  return reason instanceof Error ? reason.message || reason.name : String(reason)
}
