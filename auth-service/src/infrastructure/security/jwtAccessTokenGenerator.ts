import jwt from 'jsonwebtoken'

import { AccessTokenGenerator } from '../../application/ports/accessTokenGenerator'
import { AccessTokenPayload } from '../../application/ports/accessTokenPayload'

export class JwtAccessTokenGenerator implements AccessTokenGenerator {
  constructor(
    private readonly secret: string,
    private readonly expiresIn: jwt.SignOptions['expiresIn'] = '15m'
  ) {}

  async generate(payload: AccessTokenPayload): Promise<string> {
    return jwt.sign(
      {
        sub: payload.subject,
        username: payload.username,
        email: payload.email,
        roles: payload.roles,
      },
      this.secret,
      {
        issuer: 'auth-service',
        expiresIn: this.expiresIn,
      }
    )
  }
}
