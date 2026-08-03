import { randomUUID } from 'crypto'
import { UseCase } from '@cinescope/shared/application'
import { User } from '@auth/domain/entities/user'
import { UserRepository } from '@auth/domain/repositories/userRepository'
import { PasswordHasher } from '@auth/domain/services/passwordHasher'
import { SignUpRequest } from './signUpRequest'
import { SignUpResponse } from './signUpResponse'
import { EmailAlreadyExistsError } from '@auth/domain/errors/emailAlreadyExistsError'
import { UsernameAlreadyExistsError } from '@auth/domain/errors/usernameAlreadyExistsError'
import { RoleRepository } from '@auth/domain/repositories/roleRepository'
import { RoleNotFoundError } from '@auth/domain/errors/roleNotFoundError'
import { UserStatus } from '@auth/domain/enums/userStatus'
import { Password } from '@auth/domain/value-objects/password'
import { Email } from '@auth/domain/value-objects/email'
import { Username } from '@auth/domain/value-objects/username'

export class SignUpUseCase implements UseCase<SignUpRequest, SignUpResponse> {
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
