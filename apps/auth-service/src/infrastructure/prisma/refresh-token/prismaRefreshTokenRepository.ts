import { RefreshToken } from '@auth/domain/entities/refreshToken'
import { RefreshTokenRepository } from '@auth/domain/repositories/refreshTokenRepository'
import { PrismaClient } from '../generated/client'
import { PrismaRefreshTokenMapper } from './prismaRefreshTokenMapper'

export class PrismaRefreshTokenRepository implements RefreshTokenRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByToken(token: string): Promise<RefreshToken | null> {
    const row = await this.prisma.refreshToken.findUnique({ where: { token } })

    return row ? PrismaRefreshTokenMapper.toDomain(row) : null
  }

  async save(refreshToken: RefreshToken): Promise<void> {
    await this.prisma.refreshToken.create({
      data: PrismaRefreshTokenMapper.toPersistence(refreshToken),
    })
  }

  async update(refreshToken: RefreshToken): Promise<void> {
    const { id, ...data } = PrismaRefreshTokenMapper.toPersistence(refreshToken)

    await this.prisma.refreshToken.update({ where: { id }, data })
  }
}
