import { DomainError } from './domainError'

export class InvalidCredentialsError extends DomainError {
  constructor() {
    super('Invalid credentials.')
  }
}
