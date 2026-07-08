import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from './generated/client'
import { env } from '../../config/env'

const adapter = new PrismaPg({
  connectionString: env.DATABASE_URL,
})

export const prisma = new PrismaClient({ adapter })
