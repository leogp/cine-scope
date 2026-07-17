import jwt from 'jsonwebtoken'
import { JwtAccessTokenGenerator } from '../../../src/infrastructure/security/jwtAccessTokenGenerator'

const SECRET = 'test-access-secret-0123456789'

const payload = {
  subject: 'user-1',
  username: 'leo_dev',
  email: 'leo@example.com',
  roles: ['user'],
}

describe('JwtAccessTokenGenerator', () => {
  it('signs a verifiable token with the expected claims', async () => {
    const generator = new JwtAccessTokenGenerator(SECRET, '15m')

    const token = await generator.generate(payload)
    const decoded = jwt.verify(token, SECRET) as jwt.JwtPayload

    expect(decoded.sub).toBe('user-1')
    expect(decoded.username).toBe('leo_dev')
    expect(decoded.email).toBe('leo@example.com')
    expect(decoded.roles).toEqual(['user'])
    expect(decoded.iss).toBe('auth-service')
  })

  it('expires according to the configured duration', async () => {
    const generator = new JwtAccessTokenGenerator(SECRET, '15m')

    const token = await generator.generate(payload)
    const decoded = jwt.verify(token, SECRET) as jwt.JwtPayload

    expect(decoded.exp! - decoded.iat!).toBe(15 * 60)
  })

  it('cannot be verified with a different secret', async () => {
    const generator = new JwtAccessTokenGenerator(SECRET)

    const token = await generator.generate(payload)

    expect(() => jwt.verify(token, 'another-secret-0123456789')).toThrow(jwt.JsonWebTokenError)
  })
})
