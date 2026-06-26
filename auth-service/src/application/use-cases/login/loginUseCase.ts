import { User } from '../../../domain/entities/user'
import { InvalidCredentialsError } from '../../../domain/errors/invalidCredentialsError'
import { UserNotFoundError } from '../../../domain/errors/userNotFoundError'
import { RefreshTokenRepository } from '../../../domain/repositories/refreshTokenRepository'
import { UserRepository } from '../../../domain/repositories/userRepository'
import { PasswordHasher } from '../../../domain/services/passwordHasher'
import { TokenGenerator } from '../../../domain/services/tokenGenerator'
import { LoginResponse } from './loginResponse'

export class LoginUseCase {
  private readonly userRepository: UserRepository
  private readonly passwordHasher: PasswordHasher
  private readonly tokenGenerator: TokenGenerator
  private readonly refreshTokenRepository: RefreshTokenRepository

  constructor(
    userRepository: UserRepository,
    passwordHasher: PasswordHasher,
    tokenGenerator: TokenGenerator,
    refreshTokenRepository: RefreshTokenRepository
  ) {
    this.userRepository = userRepository
    this.passwordHasher = passwordHasher
    this.tokenGenerator = tokenGenerator
    this.refreshTokenRepository = refreshTokenRepository
  }

  async execute(body: User): Promise<LoginResponse> {
    const user = await this.userRepository.findByEmail(body.email)

    if (!user) {
      throw new UserNotFoundError()
    }

    const isPasswordValid = await this.passwordHasher.compare(body.password, user.password)
    if (!isPasswordValid) {
      throw new InvalidCredentialsError()
    }

    const accessToken = await this.tokenGenerator.generateAccessToken(user)

    const refreshToken = await this.tokenGenerator.generateRefreshToken(user)

    await this.refreshTokenRepository.save(refreshToken)

    return {
      accessToken,
      refreshToken: refreshToken.token,
    }
  }
}
