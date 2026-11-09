import type {
  CachedResponse,
  ResponseCacheStore,
} from '@gateway/infrastructure/http/cache/responseCacheStore'

interface StoredEntry {
  readonly entry: CachedResponse
  readonly expiresAt: number
}

/**
 * In-process ResponseCacheStore for the HTTP suites, as express-rate-limit's
 * MemoryStore is for the rate-limit suites. Expiry is measured on an injected
 * clock, so a test expires an entry by moving the clock instead of sleeping.
 *
 * Never for the gateway itself: each replica would keep its own entries and
 * generations, and a write through one would invalidate nothing on the others.
 */
export class MemoryResponseCacheStore implements ResponseCacheStore {
  readonly #now: () => number
  readonly #generations = new Map<string, number>()
  readonly #entries = new Map<string, StoredEntry>()

  constructor(now: () => number = Date.now) {
    this.#now = now
  }

  /** Entries stored so far, expired or not. */
  get entryCount(): number {
    return this.#entries.size
  }

  getGeneration(key: string): Promise<number> {
    return Promise.resolve(this.#generations.get(key) ?? 0)
  }

  incrementGeneration(key: string): Promise<void> {
    this.#generations.set(key, (this.#generations.get(key) ?? 0) + 1)
    return Promise.resolve()
  }

  getEntry(key: string): Promise<CachedResponse | undefined> {
    const stored = this.#entries.get(key)
    return Promise.resolve(stored && this.#now() < stored.expiresAt ? stored.entry : undefined)
  }

  setEntry(key: string, entry: CachedResponse, ttlMs: number): Promise<void> {
    this.#entries.set(key, { entry, expiresAt: this.#now() + ttlMs })
    return Promise.resolve()
  }
}
