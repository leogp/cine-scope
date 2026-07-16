import { RefreshTokenRepository } from '../../../domain/repositories/refreshTokenRepository'
import { LogoutRequest } from './logoutRequest'

export class LogoutUseCase {
  private readonly refreshTokenRepository: RefreshTokenRepository

  constructor(refreshTokenRepository: RefreshTokenRepository) {
    this.refreshTokenRepository = refreshTokenRepository
  }

  async execute(body: LogoutRequest): Promise<void> {
    const refreshToken = await this.refreshTokenRepository.findByToken(body.refreshToken)

    if (!refreshToken) {
      return
    }
    // No se revoca el access token porque expira automáticamente después de un tiempo determinado
    refreshToken.revoke()

    await this.refreshTokenRepository.update(refreshToken)
  }
}
