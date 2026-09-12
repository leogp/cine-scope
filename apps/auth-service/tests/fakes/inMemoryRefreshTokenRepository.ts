import { RefreshToken } from '@auth/domain/entities/refreshToken'
import { RefreshTokenRepository } from '@auth/domain/repositories/refreshTokenRepository'

export class InMemoryRefreshTokenRepository implements RefreshTokenRepository {
  private readonly tokens = new Map<string, RefreshToken>()

  get size(): number {
    return this.tokens.size
  }

  async findByToken(token: string): Promise<RefreshToken | null> {
    const match = [...this.tokens.values()].find(
      (refreshToken) => refreshToken.data.token === token
    )

    return match ?? null
  }

  async save(refreshToken: RefreshToken): Promise<void> {
    this.tokens.set(refreshToken.id, refreshToken)
  }

  async update(refreshToken: RefreshToken): Promise<void> {
    this.tokens.set(refreshToken.id, refreshToken)
  }
}
