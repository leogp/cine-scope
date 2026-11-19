import { BASE_URL } from './env'

export interface ApiRequest {
  readonly method?: 'GET' | 'POST' | 'PUT'
  /** Sent as `Authorization: Bearer <token>`; without one the call is anonymous. */
  readonly token?: string
  /** Serialized as JSON. */
  readonly body?: unknown
  readonly timeoutMs?: number
}

export interface ApiResponse {
  readonly status: number
  readonly headers: Headers
  /** Parsed when the response declares JSON, the raw text otherwise, undefined when empty. */
  readonly body: unknown
}

/**
 * Bounds every call, so a gateway that accepts the connection and never answers
 * fails one test with a clear error instead of running into Jest's timeout.
 */
const DEFAULT_TIMEOUT_MS = 10_000

/** One request to the gateway: the suite's only way into the system. */
export async function api(path: string, request: ApiRequest = {}): Promise<ApiResponse> {
  const { method = 'GET', token, body, timeoutMs = DEFAULT_TIMEOUT_MS } = request

  const headers: Record<string, string> = { accept: 'application/json' }
  if (token !== undefined) headers.authorization = `Bearer ${token}`
  if (body !== undefined) headers['content-type'] = 'application/json'

  // Concatenated, not `new URL(path, BASE_URL)`, which would drop a path prefix
  // on the base URL (an ingress mounted under /api, say).
  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  })

  return { status: response.status, headers: response.headers, body: await readBody(response) }
}

async function readBody(response: Response): Promise<unknown> {
  const text = await response.text()
  if (text === '') return undefined

  const type = response.headers.get('content-type') ?? ''
  return /^application\/json\b/i.test(type) ? (JSON.parse(text) as unknown) : text
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** The non-empty string `body[name]`, or a throw that shows the body. */
export function stringField(body: unknown, name: string): string {
  const value = isRecord(body) ? body[name] : undefined
  if (typeof value !== 'string' || value === '') {
    throw new Error(`Expected a non-empty string "${name}" in ${JSON.stringify(body)}`)
  }
  return value
}

/** Status, X-Cache when present, and body: enough to diagnose a failure from the log. */
export function summarize(response: ApiResponse): string {
  const cache = response.headers.get('x-cache')
  const cacheNote = cache === null ? '' : ` (X-Cache: ${cache})`
  return `HTTP ${response.status}${cacheNote} ${JSON.stringify(response.body)}`
}

/**
 * For setup steps, which run outside Jest and so without `expect`: a wrong
 * status throws with the response attached.
 */
export function ensureStatus(response: ApiResponse, expected: number, action: string): void {
  if (response.status === expected) return

  const hint =
    response.status === 429
      ? `\nRate limited (Retry-After: ${response.headers.get('retry-after') ?? '?'} s). On login ` +
        'or signup this is the credentials tier: see "Credentials budget" in docs/development.md.'
      : ''
  throw new Error(
    `Could not ${action}: expected HTTP ${expected}, got ${summarize(response)}${hint}`
  )
}
