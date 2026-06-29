import { ApplicationError } from './applicationError'

export class InvalidCredentialsError extends ApplicationError {
  constructor() {
    super('Invalid credentials.')
  }
}
