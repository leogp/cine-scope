import { LogoutUseCase } from '@auth/application/use-cases/logout/logoutUseCase'
import { RefreshToken } from '@auth/domain/entities/refreshToken'
import { InMemoryRefreshTokenRepository } from '../fakes/inMemoryRefreshTokenRepository'

const makeSut = async () => {
  const refreshTokenRepository = new InMemoryRefreshTokenRepository()

  await refreshTokenRepository.save(
    RefreshToken.create({
      id: 'token-1',
      token: 'active-token',
      userId: 'user-1',
      expiresAt: new Date(Date.now() + 60_000),
      revoked: false,
    })
  )

  return { useCase: new LogoutUseCase(refreshTokenRepository), refreshTokenRepository }
}

describe('LogoutUseCase', () => {
  it('revokes the refresh token', async () => {
    const { useCase, refreshTokenRepository } = await makeSut()

    await useCase.execute({ refreshToken: 'active-token' })

    const token = await refreshTokenRepository.findByToken('active-token')
    expect(token!.isRevoked()).toBe(true)
  })

  it('resolves silently for an unknown token (idempotent)', async () => {
    const { useCase } = await makeSut()

    await expect(useCase.execute({ refreshToken: 'ghost-token' })).resolves.toBeUndefined()
  })

  it('tolerates a repeated logout with the same token', async () => {
    const { useCase, refreshTokenRepository } = await makeSut()

    await useCase.execute({ refreshToken: 'active-token' })
    await expect(useCase.execute({ refreshToken: 'active-token' })).resolves.toBeUndefined()

    const token = await refreshTokenRepository.findByToken('active-token')
    expect(token!.isRevoked()).toBe(true)
  })
})
