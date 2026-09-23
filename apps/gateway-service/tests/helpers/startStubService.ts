import express from 'express'
import type { Server } from 'http'
import type { AddressInfo } from 'net'

export interface StubRequest {
  readonly method: string
  readonly url: string
  readonly headers: Record<string, string | string[] | undefined>
  readonly body: string
}

export interface StubService {
  readonly url: string
  readonly received: StubRequest[]
  readonly close: () => Promise<void>
}

/**
 * A downstream stand-in on an ephemeral port that records what actually arrived.
 *
 * It collects raw bytes instead of parsing: these tests exist to prove the
 * gateway forwards the body untouched, whatever its content-type, so parsing
 * here would hide the very thing under test.
 */
export async function startStubService(name = 'stub-service'): Promise<StubService> {
  const received: StubRequest[] = []
  const app = express()

  app.use((req, res) => {
    const chunks: Buffer[] = []

    req.on('data', (chunk: Buffer) => chunks.push(chunk))
    req.on('end', () => {
      received.push({
        method: req.method,
        url: req.url,
        headers: req.headers,
        body: Buffer.concat(chunks).toString('utf8'),
      })

      res.status(200).json({ service: name, url: req.url })
    })
  })

  const server = await new Promise<Server>((resolve) => {
    const started = app.listen(0, '127.0.0.1', () => resolve(started))
  })

  const { port } = server.address() as AddressInfo
  let closed = false

  return {
    url: `http://127.0.0.1:${port}`,
    received,
    // Idempotent: the "service is down" test closes the stub mid-test, and
    // afterEach closes it again.
    close: () =>
      new Promise<void>((resolve, reject) => {
        if (closed) return resolve()
        closed = true
        server.close((err) => (err ? reject(err) : resolve()))
      }),
  }
}
