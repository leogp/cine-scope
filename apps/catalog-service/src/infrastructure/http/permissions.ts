/**
 * Permissions this service enforces. The names are defined by auth-service's seed
 * (`apps/auth-service/src/infrastructure/prisma/seed.ts`) and granted to the
 * `editor` and `admin` roles — not to the default `user` role.
 */
export const CATALOG_WRITE = 'catalog:write'
