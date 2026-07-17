import jwt from 'jsonwebtoken'
import { JwtRefreshTokenGenerator } from '../../../src/infrastructure/security/jwtRefreshTokenGenerator'

const SECRET = 'test-refresh-secret-0123456789'

describe('JwtRefreshTokenGenerator', () => {
  it('signs a verifiable token carrying only the subject as custom claim', async () => {
    const generator = new JwtRefreshTokenGenerator(SECRET, '30d')

    const { token } = await generator.generate('user-1')
    const decoded = jwt.verify(token, SECRET) as jwt.JwtPayload

    expect(decoded.sub).toBe('user-1')
    expect(decoded.iss).toBe('auth-service')
    expect(decoded.exp! - decoded.iat!).toBe(30 * 24 * 60 * 60)
    expect(Object.keys(decoded).sort()).toEqual(['exp', 'iat', 'iss', 'jti', 'sub'])
  })

  it('returns an expiresAt that matches the token exp claim', async () => {
    const generator = new JwtRefreshTokenGenerator(SECRET, '30d')

    const { token, expiresAt } = await generator.generate('user-1')
    const decoded = jwt.verify(token, SECRET) as jwt.JwtPayload

    expect(expiresAt.getTime()).toBe(decoded.exp! * 1000)
  })

  it('issues a unique jti per token', async () => {
    const generator = new JwtRefreshTokenGenerator(SECRET)

    const first = await generator.generate('user-1')
    const second = await generator.generate('user-1')

    const firstJti = (jwt.decode(first.token) as jwt.JwtPayload).jti
    const secondJti = (jwt.decode(second.token) as jwt.JwtPayload).jti

    expect(firstJti).toBeTruthy()
    expect(firstJti).not.toBe(secondJti)
  })
})
