import { Entity, EntityProps } from '@cinescope/shared/domain'

export interface RefreshTokenProps extends EntityProps {
  token: string
  userId: string
  expiresAt: Date
  revoked: boolean
}

export class RefreshToken extends Entity<RefreshTokenProps> {
  private constructor(props: RefreshTokenProps) {
    super(props)
  }

  static create(props: RefreshTokenProps): RefreshToken {
    return new RefreshToken(props)
  }

  isExpired(): boolean {
    return this.props.expiresAt.getTime() < Date.now()
  }

  isRevoked(): boolean {
    return this.props.revoked
  }

  revoke(): void {
    this.props.revoked = true
  }
}
