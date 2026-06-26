import { randomUUID } from 'crypto'
import { User } from '../../../domain/entities/user'
import { UserRepository } from '../../../domain/repositories/userRepository'
import { PasswordHasher } from '../../../domain/services/passwordHasher'
import { SignUpRequest } from './signUpRequest'
import { SignUpResponse } from './signUpResponse'

export class SignUpUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher
  ) {}

  async execute(request: SignUpRequest): Promise<SignUpResponse> {
    const existingEmail = await this.userRepository.findByEmail(request.email)

    if (existingEmail) {
      throw new Error('Email already exists')
    }

    const existingUsername = await this.userRepository.findByUsername(request.username)

    if (existingUsername) {
      throw new Error('Username already exists')
    }

    const hashedPassword = await this.passwordHasher.hash(request.password)

    const user: User = {
      id: randomUUID(),
      username: request.username,
      email: request.email,
      password: hashedPassword,
      name: request.name,
      status: 'active',
    }

    await this.userRepository.save(user)

    return {
      id: user.id,
    }
  }
}
