import { ApplicationError } from './applicationError'

export class RefreshTokenExpiredError extends ApplicationError {
  constructor() {
    super('Refresh token expired.')
  }
}
