import { DomainError } from './domainError'

export class RefreshTokenRevokedError extends DomainError {
  constructor() {
    super('Refresh token revoked.')
  }
}
