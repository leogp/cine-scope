import { CATALOG_WRITE } from './permissions'

/** Decided against permissions only, never roles. */
export type Access =
  | { readonly level: 'public' }
  | { readonly level: 'authenticated' }
  | { readonly level: 'permission'; readonly permission: string }

/** `get` also covers HEAD, as it does in Express. */
export type RuleMethod = 'all' | 'get' | 'post' | 'put' | 'patch' | 'delete'

export interface AccessRule {
  readonly method: RuleMethod
  /** An Express route path relative to the prefix: the path the service itself sees. */
  readonly path: string
  readonly access: Access
}

export interface PrefixPolicy {
  /** Must be a route table prefix; buildAuthorization refuses to start otherwise. */
  readonly prefix: `/${string}`
  readonly rules: readonly AccessRule[]
}

export interface AccessPolicy {
  /** Applied under every proxied prefix, ahead of that prefix's own rules. */
  readonly everyPrefix: readonly AccessRule[]
  readonly prefixes: readonly PrefixPolicy[]
}

const PUBLIC: Access = { level: 'public' }

/**
 * Who may send which request, per proxied prefix. The route table says where a
 * request goes; this says who may send it.
 *
 * Within a prefix the first matching rule decides. A request that no rule
 * matches needs an authenticated caller (fail-closed), which is what
 * /recommendation, /review and /watchlist get today. `catalog:read` is
 * deliberately not enforced: catalog reads are public downstream too (ADR 0001).
 */
export const ACCESS_POLICY: AccessPolicy = {
  everyPrefix: [{ method: 'get', path: '/health', access: PUBLIC }],
  prefixes: [
    {
      prefix: '/auth',
      rules: [
        { method: 'post', path: '/signup', access: PUBLIC },
        { method: 'post', path: '/login', access: PUBLIC },
        { method: 'post', path: '/refresh', access: PUBLIC },
        { method: 'post', path: '/logout', access: PUBLIC },
      ],
    },
    {
      prefix: '/catalog',
      rules: [
        { method: 'get', path: '*', access: PUBLIC },
        // Every other method on every path, so a write route catalog adds later
        // is guarded without a policy change.
        { method: 'all', path: '*', access: { level: 'permission', permission: CATALOG_WRITE } },
      ],
    },
  ],
}
