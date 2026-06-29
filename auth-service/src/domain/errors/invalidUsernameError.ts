import { DomainError } from './domainError'

export class InvalidUsernameError extends DomainError {
  constructor() {
    super('Invalid username.')
  }
}
