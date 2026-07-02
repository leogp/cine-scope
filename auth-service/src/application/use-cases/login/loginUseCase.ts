// Repositories
import { RefreshTokenRepository } from '../../../domain/repositories/refreshTokenRepository'
import { UserRepository } from '../../../domain/repositories/userRepository'
// domain services and ports
import { PasswordHasher } from '../../../domain/services/passwordHasher'
import { RefreshToken } from '../../../domain/entities/refreshToken'
import { AccessTokenGenerator } from '../../ports/accessTokenGenerator'
import { RefreshTokenGenerator } from '../../ports/refreshTokenGenerator'
// Imports for request and response
import { LoginResponse } from './loginResponse'
import { LoginRequest } from './loginRequest'
// Errors
import { InvalidCredentialsError } from '../../errors/invalidCredentialsError'
import { UserNotFoundError } from '../../../domain/errors/userNotFoundError'

export class LoginUseCase {
  private readonly userRepository: UserRepository
  private readonly passwordHasher: PasswordHasher
  private readonly accessTokenGenerator: AccessTokenGenerator
  private readonly refreshTokenGenerator: RefreshTokenGenerator
  private readonly refreshTokenRepository: RefreshTokenRepository

  constructor(
    userRepository: UserRepository,
    passwordHasher: PasswordHasher,
    accessTokenGenerator: AccessTokenGenerator,
    refreshTokenGenerator: RefreshTokenGenerator,
    refreshTokenRepository: RefreshTokenRepository
  ) {
    this.userRepository = userRepository
    this.passwordHasher = passwordHasher
    this.accessTokenGenerator = accessTokenGenerator
    this.refreshTokenGenerator = refreshTokenGenerator
    this.refreshTokenRepository = refreshTokenRepository
  }

  async execute(request: LoginRequest): Promise<LoginResponse> {
    const user = await this.userRepository.findByEmail(request.email)

    if (!user) {
      throw new UserNotFoundError()
    }

    const isPasswordValid = await this.passwordHasher.compare(request.password, user.passwordHash)
    if (!isPasswordValid) {
      throw new InvalidCredentialsError()
    }

    // generate access token and refresh token

    const accessToken = await this.accessTokenGenerator.generate({
      subject: user.id,
      username: user.username.toString(),
      email: user.email.toString(),
      roles: user.roles.map((role) => role.name),
    })

    const generatedRefreshToken = await this.refreshTokenGenerator.generate(user.id)

    const refreshToken = RefreshToken.create({
      id: crypto.randomUUID(),
      token: generatedRefreshToken.token,
      userId: user.id,
      expiresAt: generatedRefreshToken.expiresAt,
      revoked: false,
    })

    await this.refreshTokenRepository.save(refreshToken)

    return {
      accessToken,
      refreshToken: refreshToken.token,
    }
  }
}
