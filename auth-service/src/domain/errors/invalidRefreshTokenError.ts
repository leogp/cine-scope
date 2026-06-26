import { DomainError } from './domainError'

export class InvalidRefreshTokenError extends DomainError {
  constructor() {
    super('Invalid refresh token.')
  }
}
