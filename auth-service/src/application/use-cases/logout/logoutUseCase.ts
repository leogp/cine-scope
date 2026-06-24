import { User } from '../../domain/entities/user'
import { UserRepository } from '../../domain/repositories/userRepository'
import { TokenGenerator } from '../../domain/services/tokenGenerator'

export class LogoutUseCase {
  private readonly _userRepository: UserRepository
  private readonly _tokenGenerator: TokenGenerator

  constructor(userRepository: UserRepository, tokenGenerator: TokenGenerator) {
    this._userRepository = userRepository
    this._tokenGenerator = tokenGenerator
  }

  async execute(body: User): Promise<void> {
    const user = await this._userRepository.findById(body.id)
    if (!user) {
      throw new Error('User not found')
    }

    await this._tokenGenerator.invalidateToken(body.id)
  }
}
