import { ApplicationError } from './applicationError'

export class RefreshTokenRevokedError extends ApplicationError {
  constructor() {
    super('Refresh token revoked.')
  }
}
