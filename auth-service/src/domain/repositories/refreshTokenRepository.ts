import { RefreshToken } from '../entities/refreshToken'

export interface RefreshTokenRepository {
  findByToken(token: string): Promise<RefreshToken | null>

  save(refreshToken: RefreshToken): Promise<void>

  update(refreshToken: RefreshToken): Promise<void>
}
