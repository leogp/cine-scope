import { DomainError } from './domainError'

export class InvalidEmailError extends DomainError {
  constructor() {
    super('Invalid email address.')
  }
}
