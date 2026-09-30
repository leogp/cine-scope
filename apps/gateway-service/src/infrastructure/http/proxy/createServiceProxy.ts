import type { Request, RequestHandler, Response } from 'express'
import type { Socket } from 'net'
import { createProxyMiddleware } from 'http-proxy-middleware'

import type { ProxyRoute } from './routeTable'

export interface ServiceProxyConfig {
  readonly route: ProxyRoute
  readonly timeoutMs: number
}

/**
 * One proxy per downstream service.
 *
 * Note what is deliberately absent: `pathRewrite`. In v3 the proxy forwards
 * `req.url`, which Express has already stripped of the mount path, so mounting
 * this at `/catalog` sends `/catalog/movies` on as `/movies`. A
 * `pathRewrite: { '^/catalog': '' }` here would match nothing and quietly do
 * nothing.
 */
export function createServiceProxy({ route, timeoutMs }: ServiceProxyConfig): RequestHandler {
  return createProxyMiddleware<Request, Response>({
    target: route.target,

    // Downstream services see their own address in Host, not the gateway's.
    // The original Host survives as X-Forwarded-Host.
    changeOrigin: true,

    // X-Forwarded-For / -Port / -Proto / -Host.
    xfwd: true,

    proxyTimeout: timeoutMs, // no response from the target
    timeout: timeoutMs, // no data from the client

    logger: console,

    on: { error: buildProxyErrorHandler(route) },
  })
}

function buildProxyErrorHandler({ prefix, target }: ProxyRoute) {
  return function onProxyError(err: Error, _req: Request, res: Response | Socket): void {
    console.error(`[gateway] ${prefix} -> ${target} failed: ${err.message}`)

    // `res` is a raw socket on websocket upgrades, and on a mid-stream failure
    // the status line is already on the wire. Neither case leaves room for a
    // JSON envelope, so the connection is simply torn down.
    if (!('status' in res) || res.headersSent) {
      res.destroy()
      return
    }

    // Envelope matches @cinescope/shared's buildErrorHandler, so clients see one
    // error shape whether the gateway or a service produced it.
    res.status(502).json({
      error: 'BadGateway',
      message: `Upstream service for ${prefix} is unavailable`,
    })
  }
}
