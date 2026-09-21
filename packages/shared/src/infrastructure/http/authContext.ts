/**
 * The verified caller, as `requireAuth` reconstructs it from the access token.
 *
 * Authorization decisions are made against `permissions`; `roles` is carried for
 * logging and for coarser rules (the gateway) that reason in roles rather than
 * individual permissions.
 */
export interface AuthContext {
  userId: string
  username: string
  email: string
  roles: string[]
  permissions: string[]
}

// Augments Express's Request so `req.auth` is typed in every consuming service.
// Optional on purpose: only routes behind `requireAuth` are guaranteed to have it,
// which is what forces `requirePermission` to handle the absent case.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AuthContext
    }
  }
}
