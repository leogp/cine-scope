import type { Application } from 'express'
import { request as httpRequest, type IncomingHttpHeaders, type Server } from 'http'
import type { AddressInfo } from 'net'

export interface GatewayServer {
  readonly url: string
  readonly close: () => Promise<void>
}

export interface SentResponse {
  readonly status: number
  readonly headers: IncomingHttpHeaders
  readonly body: string
}

export interface SendOptions {
  readonly method?: string
  readonly headers?: Record<string, string>
}

/** Serves `app` on an ephemeral loopback port, as startStubService does. */
export async function listen(app: Application): Promise<GatewayServer> {
  const server = await new Promise<Server>((resolve) => {
    const started = app.listen(0, '127.0.0.1', () => resolve(started))
  })
  const { port } = server.address() as AddressInfo

  return {
    url: `http://127.0.0.1:${port}`,
    close: () =>
      new Promise<void>((resolve, reject) =>
        server.close((err) => (err ? reject(err) : resolve()))
      ),
  }
}

/**
 * Sends a request whose socket is bound to `localAddress`, so the gateway sees
 * a different client the only way it trusts one: the TCP peer address, not a
 * header.
 *
 * Relies on Linux loopback: Linux routes all of 127.0.0.0/8 to `lo`, so
 * 127.0.0.2, 127.0.0.3… can be bound with no setup. That holds because the
 * suites run in containers (the compose `deps` service locally, ubuntu runners
 * in CI). On a bare macOS host only 127.0.0.1 exists and these binds fail with
 * EADDRNOTAVAIL.
 *
 * `agent: false` gives every call its own connection, so no pooled socket
 * carries one address into another test.
 */
export function sendFrom(
  localAddress: string,
  url: string,
  { method = 'GET', headers = {} }: SendOptions = {}
): Promise<SentResponse> {
  return new Promise((resolve, reject) => {
    const req = httpRequest(url, { method, headers, localAddress, agent: false }, (res) => {
      const chunks: Buffer[] = []
      res.on('data', (chunk: Buffer) => chunks.push(chunk))
      res.on('end', () =>
        resolve({
          status: res.statusCode ?? 0,
          headers: res.headers,
          body: Buffer.concat(chunks).toString('utf8'),
        })
      )
    })
    req.on('error', reject)
    req.end()
  })
}
