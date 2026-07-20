import { DomainError } from './domainError'

export class UserNotFoundError extends DomainError {
  constructor() {
    super('User not found.')
  }
}
