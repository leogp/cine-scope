// application/use-cases/refresh-token/RefreshTokenUseCase.ts

import { RefreshTokenRepository } from '../../../domain/repositories/refreshTokenRepository'
import { UserRepository } from '../../../domain/repositories/userRepository'
import { TokenGenerator } from '../../../domain/services/tokenGenerator'
import { RefreshTokenRequest } from './refreshTokenRequest'
import { RefreshTokenResponse } from './RefreshTokenResponse'

export class RefreshTokenUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly tokenGenerator: TokenGenerator
  ) {}

  async execute(request: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    const currentRefreshToken = await this.refreshTokenRepository.findByToken(request.refreshToken)

    if (!currentRefreshToken) {
      throw new Error('Invalid refresh token')
    }

    if (currentRefreshToken.isExpired()) {
      throw new Error('Refresh token expired')
    }

    if (currentRefreshToken.isRevoked()) {
      throw new Error('Refresh token revoked')
    }

    const user = await this.userRepository.findById(currentRefreshToken.userId)

    if (!user) {
      throw new Error('Invalid refresh token')
    }

    const accessToken = await this.tokenGenerator.generateAccessToken(user)

    currentRefreshToken.revoke()

    await this.refreshTokenRepository.update(currentRefreshToken)

    const newRefreshToken = await this.tokenGenerator.generateRefreshToken(user)

    await this.refreshTokenRepository.save(newRefreshToken)

    return {
      accessToken,
      refreshToken: newRefreshToken.token,
    }
  }
}
