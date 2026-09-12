import { UseCase } from '@cinescope/shared/application'
import { InvalidRefreshTokenError } from '@auth/application/errors/invalidRefreshTokenError'
import { RefreshTokenExpiredError } from '@auth/application/errors/refreshTokenExpiredError'
import { RefreshTokenRevokedError } from '@auth/application/errors/refreshTokenRevokeError'
import { RefreshTokenRepository } from '@auth/domain/repositories/refreshTokenRepository'
import { UserRepository } from '@auth/domain/repositories/userRepository'
import { AccessTokenGenerator } from '@auth/application/ports/accessTokenGenerator'
import { RefreshTokenGenerator } from '@auth/application/ports/refreshTokenGenerator'
import { RefreshToken } from '@auth/domain/entities/refreshToken'
import { RefreshTokenRequest } from './refreshTokenRequest'
import { RefreshTokenResponse } from './refreshTokenResponse'

export class RefreshTokenUseCase implements UseCase<RefreshTokenRequest, RefreshTokenResponse> {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly accessTokenGenerator: AccessTokenGenerator,
    private readonly refreshTokenGenerator: RefreshTokenGenerator
  ) {}

  async execute(request: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    const currentRefreshToken = await this.refreshTokenRepository.findByToken(request.refreshToken)

    if (!currentRefreshToken) {
      throw new InvalidRefreshTokenError()
    }

    if (currentRefreshToken.isExpired()) {
      throw new RefreshTokenExpiredError()
    }

    if (currentRefreshToken.isRevoked()) {
      throw new RefreshTokenRevokedError()
    }

    const user = await this.userRepository.findById(currentRefreshToken.data.userId)

    if (!user) {
      throw new InvalidRefreshTokenError()
    }

    const accessToken = await this.accessTokenGenerator.generate({
      subject: user.id,
      username: user.data.username.toString(),
      email: user.data.email.toString(),
      roles: user.data.roles.map((role) => role.data.name),
    })

    currentRefreshToken.revoke()

    await this.refreshTokenRepository.update(currentRefreshToken)

    const generated = await this.refreshTokenGenerator.generate(user.id)

    const newRefreshToken = RefreshToken.create({
      id: crypto.randomUUID(),
      token: generated.token,
      userId: user.id,
      expiresAt: generated.expiresAt,
      revoked: false,
    })

    await this.refreshTokenRepository.save(newRefreshToken)

    return {
      accessToken,
      refreshToken: newRefreshToken.data.token,
    }
  }
}
