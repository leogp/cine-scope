import { UseCase } from '@cinescope/shared/application'
// Repositories
import { RefreshTokenRepository } from '@auth/domain/repositories/refreshTokenRepository'
import { UserRepository } from '@auth/domain/repositories/userRepository'
// domain services and ports
import { PasswordHasher } from '@auth/domain/services/passwordHasher'
import { RefreshToken } from '@auth/domain/entities/refreshToken'
import { AccessTokenGenerator } from '@auth/application/ports/accessTokenGenerator'
import { RefreshTokenGenerator } from '@auth/application/ports/refreshTokenGenerator'
// Imports for request and response
import { LoginResponse } from './loginResponse'
import { LoginRequest } from './loginRequest'
// Errors
import { InvalidCredentialsError } from '@auth/application/errors/invalidCredentialsError'
import { UserNotFoundError } from '@auth/domain/errors/userNotFoundError'
import { Email } from '@auth/domain/value-objects/email'

export class LoginUseCase implements UseCase<LoginRequest, LoginResponse> {
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
    // The DTO carries primitives; the value object (and its validation) is
    // built here so adapters stay decoupled from the domain.
    const user = await this.userRepository.findByEmail(new Email(request.email))

    if (!user) {
      throw new UserNotFoundError()
    }

    const isPasswordValid = await this.passwordHasher.compare(
      request.password,
      user.data.passwordHash
    )
    if (!isPasswordValid) {
      throw new InvalidCredentialsError()
    }

    // generate access token and refresh token

    const accessToken = await this.accessTokenGenerator.generate({
      subject: user.id,
      username: user.data.username.toString(),
      email: user.data.email.toString(),
      roles: user.data.roles.map((role) => role.data.name),
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
      refreshToken: refreshToken.data.token,
    }
  }
}
