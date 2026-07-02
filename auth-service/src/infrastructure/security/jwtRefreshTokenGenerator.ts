import jwt from 'jsonwebtoken'
import { randomUUID } from 'crypto'

import { RefreshTokenGenerator } from '../../application/ports/refreshTokenGenerator'
import { GeneratedRefreshToken } from '../../application/ports/generatedRefreshToken'

export class JwtRefreshTokenGenerator implements RefreshTokenGenerator {
  constructor(
    private readonly secret: string,
    private readonly expiresIn: jwt.SignOptions['expiresIn'] = '30d'
  ) {}

  async generate(subject: string): Promise<GeneratedRefreshToken> {
    const token = jwt.sign(
      {
        sub: subject,
      },
      this.secret,
      {
        issuer: 'auth-service',
        expiresIn: this.expiresIn,
        jwtid: randomUUID(),
      }
    )

    const decoded = jwt.decode(token) as jwt.JwtPayload

    return {
      token,
      expiresAt: new Date(decoded.exp! * 1000),
    }
  }
}
