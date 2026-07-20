import { RefreshToken } from '../../../src/domain/entities/refreshToken'
import { PrismaRefreshTokenRepository } from '../../../src/infrastructure/prisma/refresh-token'
import { PrismaUserRepository } from '../../../src/infrastructure/prisma/user'
import { buildUser } from '../../helpers/builders'
import { createTestPrisma, truncateAll } from '../../helpers/testDb'

const prisma = createTestPrisma()
const refreshTokenRepository = new PrismaRefreshTokenRepository(prisma)
const userRepository = new PrismaUserRepository(prisma)

const buildPersistedToken = async (): Promise<RefreshToken> => {
  // refresh_tokens.user_id has a foreign key to users
  const user = buildUser()
  await userRepository.save(user)

  const token = RefreshToken.create({
    id: 'token-1',
    token: 'refresh-token-value',
    userId: user.id,
    expiresAt: new Date('2027-01-01T00:00:00.000Z'),
    revoked: false,
  })
  await refreshTokenRepository.save(token)

  return token
}

beforeEach(async () => {
  await truncateAll(prisma)
})

afterAll(async () => {
  await prisma.$disconnect()
})

describe('PrismaRefreshTokenRepository', () => {
  it('saves a token and rehydrates it by its token string', async () => {
    const token = await buildPersistedToken()

    const found = await refreshTokenRepository.findByToken('refresh-token-value')

    expect(found).not.toBeNull()
    expect(found!.id).toBe('token-1')
    expect(found!.data.userId).toBe(token.data.userId)
    expect(found!.data.expiresAt.getTime()).toBe(token.data.expiresAt.getTime())
    expect(found!.isRevoked()).toBe(false)
  })

  it('returns null for an unknown token', async () => {
    expect(await refreshTokenRepository.findByToken('ghost-token')).toBeNull()
  })

  it('persists a revocation', async () => {
    const token = await buildPersistedToken()

    token.revoke()
    await refreshTokenRepository.update(token)

    const found = await refreshTokenRepository.findByToken('refresh-token-value')
    expect(found!.isRevoked()).toBe(true)
  })
})
