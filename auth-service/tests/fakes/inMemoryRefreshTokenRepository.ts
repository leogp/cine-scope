import { RefreshToken } from '../../src/domain/entities/refreshToken'
import { RefreshTokenRepository } from '../../src/domain/repositories/refreshTokenRepository'

export class InMemoryRefreshTokenRepository implements RefreshTokenRepository {
  private readonly tokens = new Map<string, RefreshToken>()

  get size(): number {
    return this.tokens.size
  }

  async findByToken(token: string): Promise<RefreshToken | null> {
    const match = [...this.tokens.values()].find((refreshToken) => refreshToken.token === token)

    return match ?? null
  }

  async save(refreshToken: RefreshToken): Promise<void> {
    this.tokens.set(refreshToken.id, refreshToken)
  }

  async update(refreshToken: RefreshToken): Promise<void> {
    this.tokens.set(refreshToken.id, refreshToken)
  }
}
