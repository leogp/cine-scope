import { AccessTokenGenerator } from '../../src/application/ports/accessTokenGenerator'
import { AccessTokenPayload } from '../../src/application/ports/accessTokenPayload'
import { GeneratedRefreshToken } from '../../src/application/ports/generatedRefreshToken'
import { RefreshTokenGenerator } from '../../src/application/ports/refreshTokenGenerator'

export class FakeAccessTokenGenerator implements AccessTokenGenerator {
  lastPayload: AccessTokenPayload | null = null
  private counter = 0

  async generate(payload: AccessTokenPayload): Promise<string> {
    this.lastPayload = payload
    this.counter += 1

    return `access-token-${payload.subject}-${this.counter}`
  }
}

export class FakeRefreshTokenGenerator implements RefreshTokenGenerator {
  private counter = 0

  constructor(private readonly ttlMs: number = 30 * 24 * 60 * 60 * 1000) {}

  async generate(subject: string): Promise<GeneratedRefreshToken> {
    this.counter += 1

    return {
      token: `refresh-token-${subject}-${this.counter}`,
      expiresAt: new Date(Date.now() + this.ttlMs),
    }
  }
}
