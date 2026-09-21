export interface AccessTokenPayload {
  subject: string
  username: string
  email: string
  roles: string[]
  // Effective permissions across every assigned role. Downstream services
  // authorize against these; roles are carried for coarser rules and logging.
  permissions: string[]
}
