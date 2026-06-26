import { DomainError } from './domainError'

export class RefreshTokenExpiredError extends DomainError {
  constructor() {
    super('Refresh token expired.')
  }
}
