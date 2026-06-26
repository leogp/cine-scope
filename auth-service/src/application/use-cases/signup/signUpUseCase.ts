import { randomUUID } from 'crypto'
import { User } from '../../../domain/entities/user'
import { UserRepository } from '../../../domain/repositories/userRepository'
import { PasswordHasher } from '../../../domain/services/passwordHasher'
import { SignUpRequest } from './signUpRequest'
import { SignUpResponse } from './signUpResponse'
import { EmailAlreadyExistsError } from '../../../domain/errors/emailAlreadyExistsError'
import { UsernameAlreadyExistsError } from '../../../domain/errors/usernameAlreadyExistsError'
import { RoleRepository } from '../../../domain/repositories/roleRepository'
import { RoleNotFoundError } from '../../../domain/errors/roleNotFoundError'
import { UserStatus } from '../../../domain/enums/userStatus'

export class SignUpUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly roleRepository: RoleRepository
  ) {}

  async execute(request: SignUpRequest): Promise<SignUpResponse> {
    const existingEmail = await this.userRepository.findByEmail(request.email)

    if (existingEmail) {
      throw new EmailAlreadyExistsError(request.email)
    }

    const existingUsername = await this.userRepository.findByUsername(request.username)

    if (existingUsername) {
      throw new UsernameAlreadyExistsError(request.username)
    }

    const hashedPassword = await this.passwordHasher.hash(request.password)

    const user = new User(
      randomUUID(),
      request.username,
      request.email,
      hashedPassword,
      request.name,
      UserStatus.ACTIVE
    )

    // find and assign default role to user
    const defaultRole = await this.roleRepository.getDefaultRole()

    if (!defaultRole) {
      throw new RoleNotFoundError()
    }

    user.assignRole(defaultRole)
    await this.userRepository.save(user)

    return {
      id: user.id,
    }
  }
}
