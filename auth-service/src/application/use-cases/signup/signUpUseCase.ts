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
import { Password } from '../../../domain/value-objects/password'
import { Email } from '../../../domain/value-objects/email'
import { Username } from '../../../domain/value-objects/username'

export class SignUpUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly roleRepository: RoleRepository
  ) {}

  async execute(request: SignUpRequest): Promise<SignUpResponse> {
    const email = new Email(request.email)
    const existingEmail = await this.userRepository.findByEmail(email)

    if (existingEmail) {
      throw new EmailAlreadyExistsError(request.email)
    }

    const username = new Username(request.username)
    const existingUsername = await this.userRepository.findByUsername(username)

    if (existingUsername) {
      throw new UsernameAlreadyExistsError(request.username)
    }

    const password = new Password(request.password)
    const hashedPassword = await this.passwordHasher.hash(password.toString())

    const user = User.create({
      id: randomUUID(),
      username,
      email,
      passwordHash: hashedPassword,
      name: request.name,
      status: UserStatus.ACTIVE,
    })

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
