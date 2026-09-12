import { PrismaPg } from '@prisma/adapter-pg'

import { PrismaClient } from '@catalog/infrastructure/prisma/generated/client'

/**
 * Prisma client for integration tests, wired like
 * src/infrastructure/prisma/client.ts but guarded so the suite can never
 * truncate a non-test database.
 */
export const createTestPrisma = (): PrismaClient => {
  const connectionString = process.env.DATABASE_URL ?? ''

  if (!connectionString.includes('catalog_test')) {
    throw new Error(
      `Refusing to run integration tests against "${connectionString}" — expected a catalog_test database`
    )
  }

  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) })
}

// The join tables would cascade from their parents, but naming all thirteen
// keeps the reset independent of the FK topology.
export const truncateAll = async (prisma: PrismaClient): Promise<void> => {
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE movie_genres, movie_cast, movie_directors, movie_production_companies, ' +
      'series_genres, series_cast, series_directors, series_production_companies, ' +
      'movies, series, people, companies, genres CASCADE'
  )
}
