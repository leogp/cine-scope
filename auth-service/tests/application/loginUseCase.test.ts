import { InvalidCredentialsError } from '../../src/application/errors/invalidCredentialsError'
import { LoginUseCase } from '../../src/application/use-cases/login/loginUseCase'
import { UserNotFoundError } from '../../src/domain/errors/userNotFoundError'
import { Email } from '../../src/domain/value-objects/email'
import { FakePasswordHasher } from '../fakes/fakePasswordHasher'
import { FakeAccessTokenGenerator, FakeRefreshTokenGenerator } from '../fakes/fakeTokenGenerators'
import { InMemoryRefreshTokenRepository } from '../fakes/inMemoryRefreshTokenRepository'
import { InMemoryUserRepository } from '../fakes/inMemoryUserRepository'
import { buildRole, buildUser } from '../helpers/builders'

const makeSut = async () => {
  const userRepository = new InMemoryUserRepository()
  const refreshTokenRepository = new InMemoryRefreshTokenRepository()
  const accessTokenGenerator = new FakeAccessTokenGenerator()

  const user = buildUser()
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
      email: new Email('leo@example.com'),
      password: 'Str0ng!Pass',
    })

    expect(response.accessToken).toBeTruthy()
    expect(accessTokenGenerator.lastPayload).toEqual({
      subject: user.id,
      username: 'leo_dev',
      email: 'leo@example.com',
      roles: ['user'],
    })

    const persisted = await refreshTokenRepository.findByToken(response.refreshToken)
    expect(persisted).not.toBeNull()
    expect(persisted!.userId).toBe(user.id)
    expect(persisted!.isRevoked()).toBe(false)
  })

  it('rejects an unknown email', async () => {
    const { useCase } = await makeSut()

    await expect(
      useCase.execute({ email: new Email('ghost@example.com'), password: 'Str0ng!Pass' })
    ).rejects.toThrow(UserNotFoundError)
  })

  it('rejects a wrong password and persists nothing', async () => {
    const { useCase, refreshTokenRepository } = await makeSut()

    await expect(
      useCase.execute({ email: new Email('leo@example.com'), password: 'Wr0ng!Pass' })
    ).rejects.toThrow(InvalidCredentialsError)
    expect(refreshTokenRepository.size).toBe(0)
  })
})
