import { User } from '../../../domain/entities/user'
import { UserRepository } from '../../../domain/repositories/userRepository'
import { PasswordHasher } from '../../../domain/services/passwordHasher'
import { TokenGenerator } from '../../../domain/services/tokenGenerator'

export class LoginUseCase {
  private readonly userRepository: UserRepository
  private readonly passwordHasher: PasswordHasher
  private readonly tokenGenerator: TokenGenerator

  constructor(
    userRepository: UserRepository,
    passwordHasher: PasswordHasher,
    tokenGenerator: TokenGenerator
  ) {
    this.userRepository = userRepository
    this.passwordHasher = passwordHasher
    this.tokenGenerator = tokenGenerator
  }

  async execute(body: User): Promise<string> {
    const user = await this.userRepository.findByEmail(body.email)

    if (!user) {
      throw new Error('User not found')
    }

    const isPasswordValid = await this.passwordHasher.compare(body.password, user.password)
    if (!isPasswordValid) {
      throw new Error('Invalid password')
    }

    const accessToken = await this.tokenGenerator.generateAccessToken(user)
    return accessToken
  }
}
