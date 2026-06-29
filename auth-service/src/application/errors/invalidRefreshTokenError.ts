import { ApplicationError } from './applicationError'

export class InvalidRefreshTokenError extends ApplicationError {
  constructor() {
    super('Invalid refresh token.')
  }
}
