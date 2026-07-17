import { SignUpUseCase } from '../../src/application/use-cases/signup/signUpUseCase'
import { Role } from '../../src/domain/entities/role'
import { EmailAlreadyExistsError } from '../../src/domain/errors/emailAlreadyExistsError'
import { InvalidPasswordError } from '../../src/domain/errors/invalidPasswordError'
import { RoleNotFoundError } from '../../src/domain/errors/roleNotFoundError'
import { UsernameAlreadyExistsError } from '../../src/domain/errors/usernameAlreadyExistsError'
import { Email } from '../../src/domain/value-objects/email'
import { FakePasswordHasher } from '../fakes/fakePasswordHasher'
import { InMemoryRoleRepository } from '../fakes/inMemoryRoleRepository'
import { InMemoryUserRepository } from '../fakes/inMemoryUserRepository'
import { buildRole } from '../helpers/builders'

const makeSut = (defaultRole: Role | null = buildRole()) => {
  const userRepository = new InMemoryUserRepository()
  const roleRepository = new InMemoryRoleRepository(defaultRole)
  const useCase = new SignUpUseCase(userRepository, new FakePasswordHasher(), roleRepository)

  return { useCase, userRepository }
}

const validRequest = {
  username: 'leo_dev',
  email: 'leo@example.com',
  password: 'Str0ng!Pass',
  name: 'Leo',
}

describe('SignUpUseCase', () => {
  it('creates the user with a hashed password and the default role', async () => {
    const { useCase, userRepository } = makeSut()

    const response = await useCase.execute(validRequest)

    expect(response.id).toEqual(expect.any(String))

    const saved = await userRepository.findByEmail(new Email(validRequest.email))
    expect(saved).not.toBeNull()
    expect(saved!.id).toBe(response.id)
    expect(saved!.passwordHash).toBe('hashed:Str0ng!Pass')
    expect(saved!.roles.map((role) => role.name)).toEqual(['user'])
  })

  it('rejects a duplicate email', async () => {
    const { useCase, userRepository } = makeSut()
    await useCase.execute(validRequest)

    await expect(useCase.execute({ ...validRequest, username: 'other_user' })).rejects.toThrow(
      EmailAlreadyExistsError
    )
    expect(userRepository.size).toBe(1)
  })

  it('rejects a duplicate username', async () => {
    const { useCase, userRepository } = makeSut()
    await useCase.execute(validRequest)

    await expect(useCase.execute({ ...validRequest, email: 'other@example.com' })).rejects.toThrow(
      UsernameAlreadyExistsError
    )
    expect(userRepository.size).toBe(1)
  })

  it('rejects a password that does not satisfy the policy and saves nothing', async () => {
    const { useCase, userRepository } = makeSut()

    await expect(useCase.execute({ ...validRequest, password: 'weak' })).rejects.toThrow(
      InvalidPasswordError
    )
    expect(userRepository.size).toBe(0)
  })

  it('fails when there is no default role and saves nothing', async () => {
    const { useCase, userRepository } = makeSut(null)

    await expect(useCase.execute(validRequest)).rejects.toThrow(RoleNotFoundError)
    expect(userRepository.size).toBe(0)
  })
})
