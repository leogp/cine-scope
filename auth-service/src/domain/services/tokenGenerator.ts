export interface AccessTokenPayload {
  subject: string
  username: string
  email: string
  roles: string[]
}

export interface GeneratedRefreshToken {
  token: string
  expiresAt: Date
}

export interface TokenGenerator {
  generateAccessToken(payload: AccessTokenPayload): Promise<string>

  generateRefreshToken(subject: string): Promise<GeneratedRefreshToken>
}
