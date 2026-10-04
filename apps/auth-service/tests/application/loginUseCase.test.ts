import { InvalidCredentialsError } from '@auth/application/errors/invalidCredentialsError'
import { UserInactiveError } from '@auth/application/errors/userInactiveError'
import { LoginUseCase } from '@auth/application/use-cases/login/loginUseCase'
import { CreateUserProps } from '@auth/domain/entities/user'
import { UserStatus } from '@auth/domain/enums/userStatus'
import { UserNotFoundError } from '@auth/domain/errors/userNotFoundError'
import { InvalidEmailError } from '@auth/domain/errors/invalidEmailError'
import { FakePasswordHasher } from '../fakes/fakePasswordHasher'
import { FakeAccessTokenGenerator, FakeRefreshTokenGenerator } from '../fakes/fakeTokenGenerators'
import { InMemoryRefreshTokenRepository } from '../fakes/inMemoryRefreshTokenRepository'
import { InMemoryUserRepository } from '../fakes/inMemoryUserRepository'
import { buildRole, buildUser } from '../helpers/builders'

const makeSut = async (userOverrides: Partial<CreateUserProps> = {}) => {
  const userRepository = new InMemoryUserRepository()
  const refreshTokenRepository = new InMemoryRefreshTokenRepository()
  const accessTokenGenerator = new FakeAccessTokenGenerator()

  const user = buildUser(userOverrides)
  user.assignRole(buildRole())
  await userRepository.save(user)

  const useCase = new LoginUseCase(
    userRepository,
    new FakePasswordHasher(),
    accessTokenGenerator,
    new FakeRefreshTokenGenerator(),
    refreshTokenRepository
  )

  return { useCase, user, refreshTokenRepository, accessTokenGenerator }
}

describe('LoginUseCase', () => {
  it('returns a token pair and persists the refresh token', async () => {
    const { useCase, user, refreshTokenRepository, accessTokenGenerator } = await makeSut()

    const response = await useCase.execute({
      email: 'leo@example.com',
      password: 'Str0ng!Pass',
    })

    expect(response.accessToken).toBeTruthy()
    expect(accessTokenGenerator.lastPayload).toEqual({
      subject: user.id,
      username: 'leo_dev',
      email: 'leo@example.com',
      roles: ['user'],
      permissions: ['catalog:read'],
    })

    const persisted = await refreshTokenRepository.findByToken(response.refreshToken)
    expect(persisted).not.toBeNull()
    expect(persisted!.data.userId).toBe(user.id)
    expect(persisted!.isRevoked()).toBe(false)
  })

  it('rejects an unknown email', async () => {
    const { useCase } = await makeSut()

    await expect(
      useCase.execute({ email: 'ghost@example.com', password: 'Str0ng!Pass' })
    ).rejects.toThrow(UserNotFoundError)
  })

  it('rejects a malformed email before touching the repository', async () => {
    const { useCase } = await makeSut()

    await expect(
      useCase.execute({ email: 'not-an-email', password: 'Str0ng!Pass' })
    ).rejects.toThrow(InvalidEmailError)
  })

  it('rejects a wrong password and persists nothing', async () => {
    const { useCase, refreshTokenRepository } = await makeSut()

    await expect(
      useCase.execute({ email: 'leo@example.com', password: 'Wr0ng!Pass' })
    ).rejects.toThrow(InvalidCredentialsError)
    expect(refreshTokenRepository.size).toBe(0)
  })

  it('rejects an inactive user with the correct password and issues nothing', async () => {
    const { useCase, refreshTokenRepository, accessTokenGenerator } = await makeSut({
      status: UserStatus.INACTIVE,
    })

    await expect(
      useCase.execute({ email: 'leo@example.com', password: 'Str0ng!Pass' })
    ).rejects.toThrow(UserInactiveError)
    expect(accessTokenGenerator.lastPayload).toBeNull()
    expect(refreshTokenRepository.size).toBe(0)
  })

  it('answers InvalidCredentialsError, not UserInactiveError, for an inactive user with a wrong password', async () => {
    const { useCase } = await makeSut({ status: UserStatus.INACTIVE })

    await expect(
      useCase.execute({ email: 'leo@example.com', password: 'Wr0ng!Pass' })
    ).rejects.toThrow(InvalidCredentialsError)
  })
})
