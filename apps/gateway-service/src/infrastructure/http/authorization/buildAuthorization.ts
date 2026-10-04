import { requirePermission } from '@cinescope/shared/infrastructure/http'
import { Router, type RequestHandler } from 'express'

import type { ProxyRoute } from '../proxy/routeTable'
import type { Access, AccessPolicy, AccessRule } from './accessPolicy'
import { requireAuthenticated } from './requireAuthenticated'

export interface AuthorizationConfig {
  readonly policy: AccessPolicy
  readonly routes: readonly ProxyRoute[]
}

/**
 * Builds the gateway's authorization middleware from the access policy.
 *
 * Each proxied prefix gets its own Router, mounted at the prefix exactly as its
 * proxy is, so Express strips the prefix and matches rule paths with the same
 * semantics the services use: case-insensitive, trailing slash optional. Paths
 * outside every prefix match no Router and pass through to the gateway's 404.
 *
 * Throws when the policy names a prefix the route table lacks: a typo such as
 * `/catalogs` would otherwise leave `/catalog` on the fail-closed default.
 */
export function buildAuthorization({ policy, routes }: AuthorizationConfig): RequestHandler {
  const known = new Set(routes.map((route) => route.prefix))
  const unknown = policy.prefixes.filter((entry) => !known.has(entry.prefix))

  if (unknown.length > 0) {
    const names = unknown.map((entry) => entry.prefix).join(', ')
    throw new Error(`Access policy names prefixes missing from the route table: ${names}`)
  }

  const authorization = Router()

  for (const { prefix } of routes) {
    const own = policy.prefixes.find((entry) => entry.prefix === prefix)?.rules ?? []
    authorization.use(prefix, buildPrefixGuard([...policy.everyPrefix, ...own]))
  }

  return authorization
}

function buildPrefixGuard(rules: readonly AccessRule[]): Router {
  const guard = Router()

  for (const rule of rules) {
    guard.route(rule.path)[rule.method](...handlersFor(rule.access))
  }

  // Fail-closed: no rule matched, so only an identified caller may continue.
  guard.use(requireAuthenticated)

  return guard
}

// A matched rule let the request through: next('router') leaves this prefix's
// Router, skipping the remaining rules and the default, and resumes the app chain.
const allow: RequestHandler = (_req, _res, next) => next('router')

function handlersFor(access: Access): RequestHandler[] {
  switch (access.level) {
    case 'public':
      return [allow]
    case 'authenticated':
      return [requireAuthenticated, allow]
    case 'permission':
      return [requirePermission(access.permission), allow]
  }
}
