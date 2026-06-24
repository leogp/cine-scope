import { User } from '../../domain/entities/user'
import { UserRepository } from '../../domain/repositories/userRepository'
import { PasswordHasher } from '../../domain/services/passwordHasher'
import { TokenGenerator } from '../../domain/services/tokenGenerator'

export class SignInUseCase {
  private readonly _userRepository: UserRepository
  private readonly _passwordHasher: PasswordHasher
  private readonly _tokenGenerator: TokenGenerator

  constructor(
    userRepository: UserRepository,
    passwordHasher: PasswordHasher,
    tokenGenerator: TokenGenerator
  ) {
    this._userRepository = userRepository
    this._passwordHasher = passwordHasher
    this._tokenGenerator = tokenGenerator
  }

  async execute(body: User): Promise<User | null> {
    const user = await this._userRepository.findByEmail(body.email)
    if (user) {
      throw new Error('User already exists')
    }

    const hassedPassword = await this._passwordHasher.hash(body.password)
    const userToSave = { ...body, password: hassedPassword }
    const userCreated = await this._userRepository.save(userToSave)

    return userCreated
  }
}
