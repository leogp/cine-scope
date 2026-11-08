import type { ServerResponse } from 'http'

export interface TeeOptions {
  /** Most body bytes buffered; one more and the capture is dropped. */
  readonly maxBytes: number
  /** Asked once, when the status and headers are final; false captures nothing. */
  readonly accept: () => boolean
  /** The whole body, once `end` has run, if it was accepted and stayed within `maxBytes`. */
  readonly onComplete: (body: Buffer) => void
}

/**
 * Calls `listener` once, right after the status and headers are fixed and
 * before any of the response is flushed.
 *
 * Hooks `writeHead`, which every response goes through: called explicitly, or
 * by Node on the first `write` or `end` (`_implicitHeader` calls
 * `this.writeHead`, so it reaches this instance's override). http-proxy relies
 * on the implicit call: it copies the service's status and headers onto `res`
 * with `statusCode` and `setHeader`, then pipes the body in.
 */
export function onResponseHead(res: ServerResponse, listener: () => void): void {
  const writeHead = res.writeHead
  let notified = false

  res.writeHead = function writeHeadThenNotify(this: ServerResponse, ...args: unknown[]) {
    const result = Reflect.apply(writeHead, this, args) as ServerResponse
    if (!notified) {
      notified = true
      listener()
    }
    return result
  } as ServerResponse['writeHead']
}

/**
 * Copies the body written to `res` into a buffer as it goes out.
 *
 * Captured at the response rather than in the proxy: whatever produces a
 * response ends in `write`/`end`, and http-proxy-middleware v3 (through
 * http-proxy) produces it with `proxyRes.pipe(res)`, so createServiceProxy
 * stays unaware of the cache. `selfHandleResponse` would buffer every
 * response; this buffers only what `accept` takes, and stops past `maxBytes`.
 *
 * Each override calls the original first, with the very `this` and arguments
 * it received, and returns its result: pipe() needs write's boolean for
 * backpressure, and encodings and callbacks reach Node untouched. The chunk is
 * copied after the call because the first write is what fixes the head that
 * `accept` inspects. Copies use the encoding Node applies, so the buffer holds
 * the bytes the client receives.
 *
 * A second `end` captures nothing: http-proxy-middleware's error plugin ends a
 * response the gateway's 502 handler has already answered.
 */
export function teeResponse(
  res: ServerResponse,
  { maxBytes, accept, onComplete }: TeeOptions
): void {
  let state: 'awaiting-head' | 'capturing' | 'done' = 'awaiting-head'
  let chunks: Buffer[] = []
  let size = 0

  onResponseHead(res, () => {
    state = accept() ? 'capturing' : 'done'
  })

  const collect = (chunk: unknown, encoding: unknown): void => {
    if (state !== 'capturing' || chunk === undefined || chunk === null) return

    const bytes = toBuffer(chunk, encoding)
    if (bytes === undefined || size + bytes.length > maxBytes) {
      state = 'done'
      chunks = []
      return
    }

    chunks.push(bytes)
    size += bytes.length
  }

  const write = res.write
  res.write = function writeAndCopy(this: ServerResponse, ...args: unknown[]) {
    const flushed = Reflect.apply(write, this, args) as boolean
    collect(args[0], args[1])
    return flushed
  } as ServerResponse['write']

  const end = res.end
  res.end = function endAndComplete(this: ServerResponse, ...args: unknown[]) {
    const result = Reflect.apply(end, this, args) as ServerResponse
    collect(typeof args[0] === 'function' ? undefined : args[0], args[1])

    if (state === 'capturing') {
      state = 'done'
      onComplete(Buffer.concat(chunks, size))
      chunks = []
    }
    return result
  } as ServerResponse['end']
}

function toBuffer(chunk: unknown, encoding: unknown): Buffer | undefined {
  if (typeof chunk === 'string') {
    const known = typeof encoding === 'string' && Buffer.isEncoding(encoding)
    return Buffer.from(chunk, known ? encoding : 'utf8')
  }
  if (chunk instanceof Uint8Array) return Buffer.from(chunk)
  return undefined
}
