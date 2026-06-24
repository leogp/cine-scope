export class RefreshToken {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly token: string,
    public readonly expiresAt: Date,
    public revokedAt?: Date
  ) {}

  isExpired(): boolean {
    return this.expiresAt.getTime() < Date.now()
  }

  isRevoked(): boolean {
    return !!this.revokedAt
  }

  revoke(): void {
    this.revokedAt = new Date()
  }
}
