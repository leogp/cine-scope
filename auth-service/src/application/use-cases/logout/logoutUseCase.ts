import { RefreshTokenRepository } from '../../../domain/repositories/refreshTokenRepository'
import { UserRepository } from '../../../domain/repositories/userRepository'
import { TokenGenerator } from '../../../domain/services/tokenGenerator'
import { LogoutRequest } from './logoutRequest'

export class LogoutUseCase {
  private readonly userRepository: UserRepository
  private readonly tokenGenerator: TokenGenerator
  private readonly refreshTokenRepository: RefreshTokenRepository

  constructor(
    userRepository: UserRepository,
    tokenGenerator: TokenGenerator,
    refreshTokenRepository: RefreshTokenRepository
  ) {
    this.userRepository = userRepository
    this.tokenGenerator = tokenGenerator
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
