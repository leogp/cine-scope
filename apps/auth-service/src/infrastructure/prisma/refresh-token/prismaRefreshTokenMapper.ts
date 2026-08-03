import { RefreshToken } from '@auth/domain/entities/refreshToken'
import { RefreshTokenModel } from '../generated/models'

export interface RefreshTokenPersistence {
  id: string
  token: string
  userId: string
  expiresAt: Date
  revoked: boolean
}

export class PrismaRefreshTokenMapper {
  static toDomain(row: RefreshTokenModel): RefreshToken {
    return RefreshToken.create({
      id: row.id,
      token: row.token,
      userId: row.userId,
      expiresAt: row.expiresAt,
      revoked: row.revoked,
    })
  }

  static toPersistence(refreshToken: RefreshToken): RefreshTokenPersistence {
    return {
      id: refreshToken.id,
      token: refreshToken.data.token,
      userId: refreshToken.data.userId,
      expiresAt: refreshToken.data.expiresAt,
      revoked: refreshToken.data.revoked,
    }
  }
}
