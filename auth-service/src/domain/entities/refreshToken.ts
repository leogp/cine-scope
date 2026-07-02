export interface RefreshTokenProps {
  id: string
  token: string
  userId: string
  expiresAt: Date
  revoked: boolean
}

export class RefreshToken {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly token: string,
    public readonly expiresAt: Date,
    public revoked: boolean
  ) {}

  static create(props: RefreshTokenProps): RefreshToken {
    return new RefreshToken(props.id, props.userId, props.token, props.expiresAt, props.revoked)
  }

  isExpired(): boolean {
    return this.expiresAt.getTime() < Date.now()
  }

  isRevoked(): boolean {
    return !!this.revoked
  }

  revoke(): void {
    this.revoked = true
  }
}
