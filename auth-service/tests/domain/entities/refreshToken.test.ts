import { RefreshToken } from '../../../src/domain/entities/refreshToken'

const buildToken = (overrides: Partial<Parameters<typeof RefreshToken.create>[0]> = {}) =>
  RefreshToken.create({
    id: 'token-1',
    token: 'refresh-token-value',
    userId: 'user-1',
    expiresAt: new Date(Date.now() + 60_000),
    revoked: false,
    ...overrides,
  })

describe('RefreshToken', () => {
  it('creates a token mapping every prop', () => {
    const expiresAt = new Date(Date.now() + 60_000)
    const token = buildToken({ expiresAt })

    expect(token.id).toBe('token-1')
    expect(token.token).toBe('refresh-token-value')
    expect(token.userId).toBe('user-1')
    expect(token.expiresAt).toBe(expiresAt)
    expect(token.revoked).toBe(false)
  })

  it('is not expired before expiresAt', () => {
    const token = buildToken({ expiresAt: new Date(Date.now() + 60_000) })

    expect(token.isExpired()).toBe(false)
  })

  it('is expired after expiresAt', () => {
    const token = buildToken({ expiresAt: new Date(Date.now() - 1_000) })

    expect(token.isExpired()).toBe(true)
  })

  it('is revoked after revoke()', () => {
    const token = buildToken()

    expect(token.isRevoked()).toBe(false)

    token.revoke()

    expect(token.isRevoked()).toBe(true)
  })
})
