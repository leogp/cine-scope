import { ApplicationError } from './applicationError'

export class UserInactiveError extends ApplicationError {
  constructor() {
    super('User is inactive.')
  }
}
