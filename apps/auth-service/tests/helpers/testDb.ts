import { PrismaPg } from '@prisma/adapter-pg'

import { PrismaClient } from '@auth/infrastructure/prisma/generated/client'

/**
 * Prisma client for integration tests, wired like
 * src/infrastructure/prisma/client.ts but guarded so the suite can never
 * truncate a non-test database.
 */
export const createTestPrisma = (): PrismaClient => {
  const connectionString = process.env.DATABASE_URL ?? ''

  if (!connectionString.includes('auth_test')) {
    throw new Error(
      `Refusing to run integration tests against "${connectionString}" — expected an auth_test database`
    )
  }

  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) })
}

export const truncateAll = async (prisma: PrismaClient): Promise<void> => {
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE user_roles, role_permissions, refresh_tokens, users, roles, permissions CASCADE'
  )
}
