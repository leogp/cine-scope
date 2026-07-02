import { InvalidRefreshTokenError } from '../../errors/invalidRefreshTokenError'
import { RefreshTokenExpiredError } from '../../errors/refreshTokenExpiredError'
import { RefreshTokenRevokedError } from '../../errors/refreshTokenRevokeError'
import { RefreshTokenRepository } from '../../../domain/repositories/refreshTokenRepository'
import { UserRepository } from '../../../domain/repositories/userRepository'
import { AccessTokenGenerator } from '../../ports/accessTokenGenerator'
import { RefreshTokenGenerator } from '../../ports/refreshTokenGenerator'
import { RefreshToken } from '../../../domain/entities/refreshToken'
import { RefreshTokenRequest } from './refreshTokenRequest'
import { RefreshTokenResponse } from './refreshTokenResponse'

export class RefreshTokenUseCase {
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

    const user = await this.userRepository.findById(currentRefreshToken.userId)

    if (!user) {
      throw new InvalidRefreshTokenError()
    }

    const accessToken = await this.accessTokenGenerator.generate({
      subject: user.id,
      username: user.username.toString(),
      email: user.email.toString(),
      roles: user.roles.map((role) => role.name),
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
      refreshToken: newRefreshToken.token,
    }
  }
}
