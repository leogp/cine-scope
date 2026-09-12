import { InvalidRefreshTokenError } from '@auth/application/errors/invalidRefreshTokenError'
import { RefreshTokenExpiredError } from '@auth/application/errors/refreshTokenExpiredError'
import { RefreshTokenRevokedError } from '@auth/application/errors/refreshTokenRevokeError'
import { RefreshTokenUseCase } from '@auth/application/use-cases/refresh-token/refreshTokenUseCase'
import { RefreshToken } from '@auth/domain/entities/refreshToken'
import { FakeAccessTokenGenerator, FakeRefreshTokenGenerator } from '../fakes/fakeTokenGenerators'
import { InMemoryRefreshTokenRepository } from '../fakes/inMemoryRefreshTokenRepository'
import { InMemoryUserRepository } from '../fakes/inMemoryUserRepository'
import { buildRole, buildUser } from '../helpers/builders'

const makeSut = async (tokenOverrides: Partial<Parameters<typeof RefreshToken.create>[0]> = {}) => {
  const userRepository = new InMemoryUserRepository()
  const refreshTokenRepository = new InMemoryRefreshTokenRepository()

  const user = buildUser()
  user.assignRole(buildRole())
  await userRepository.save(user)

  const existingToken = RefreshToken.create({
    id: 'token-1',
    token: 'old-token',
    userId: user.id,
    expiresAt: new Date(Date.now() + 60_000),
    revoked: false,
    ...tokenOverrides,
  })
  await refreshTokenRepository.save(existingToken)

  const useCase = new RefreshTokenUseCase(
    userRepository,
    refreshTokenRepository,
    new FakeAccessTokenGenerator(),
    new FakeRefreshTokenGenerator()
  )

  return { useCase, user, userRepository, refreshTokenRepository }
}

describe('RefreshTokenUseCase', () => {
  it('rotates the token: revokes the old one and persists a new one', async () => {
    const { useCase, user, refreshTokenRepository } = await makeSut()

    const response = await useCase.execute({ refreshToken: 'old-token' })

    expect(response.accessToken).toBeTruthy()
    expect(response.refreshToken).not.toBe('old-token')

    const oldToken = await refreshTokenRepository.findByToken('old-token')
    expect(oldToken!.isRevoked()).toBe(true)

    const newToken = await refreshTokenRepository.findByToken(response.refreshToken)
    expect(newToken).not.toBeNull()
    expect(newToken!.data.userId).toBe(user.id)
    expect(newToken!.isRevoked()).toBe(false)
  })

  it('rejects an unknown token', async () => {
    const { useCase, refreshTokenRepository } = await makeSut()

    await expect(useCase.execute({ refreshToken: 'ghost-token' })).rejects.toThrow(
      InvalidRefreshTokenError
    )
    expect(refreshTokenRepository.size).toBe(1)
  })

  it('rejects an expired token and issues nothing', async () => {
    const { useCase, refreshTokenRepository } = await makeSut({
      expiresAt: new Date(Date.now() - 1_000),
    })

    await expect(useCase.execute({ refreshToken: 'old-token' })).rejects.toThrow(
      RefreshTokenExpiredError
    )
    expect(refreshTokenRepository.size).toBe(1)
  })

  it('rejects an already revoked token and issues nothing', async () => {
    const { useCase, refreshTokenRepository } = await makeSut({ revoked: true })

    await expect(useCase.execute({ refreshToken: 'old-token' })).rejects.toThrow(
      RefreshTokenRevokedError
    )
    expect(refreshTokenRepository.size).toBe(1)
  })

  it('rejects a token whose user no longer exists', async () => {
    const { useCase, user, userRepository } = await makeSut()
    await userRepository.delete(user.id)

    await expect(useCase.execute({ refreshToken: 'old-token' })).rejects.toThrow(
      InvalidRefreshTokenError
    )
  })
})
