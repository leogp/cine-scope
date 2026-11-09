/** What the cache keeps of a response: status, body and Content-Type, nothing else. */
export interface CachedResponse {
  readonly status: number
  readonly contentType: string
  readonly body: Buffer
}

/**
 * Storage for the response cache, the counterpart of the rate limiter's Store.
 * Keys arrive fully built (cacheKeys.ts), so an adapter only stores.
 *
 * Any method may reject on any failure: the cache treats a rejected lookup as a
 * miss and ignores a rejected write. None may throw synchronously.
 */
export interface ResponseCacheStore {
  /** The counter's value; 0 when it does not exist yet. */
  getGeneration(key: string): Promise<number>
  /** Atomic increment, creating the counter at 1. Counters never expire. */
  incrementGeneration(key: string): Promise<void>
  getEntry(key: string): Promise<CachedResponse | undefined>
  /** Stores `entry` for `ttlMs`, replacing any previous one. */
  setEntry(key: string, entry: CachedResponse, ttlMs: number): Promise<void>
}
