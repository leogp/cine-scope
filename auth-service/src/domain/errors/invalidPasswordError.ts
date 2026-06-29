import { DomainError } from './domainError'

export class InvalidPasswordError extends DomainError {
  constructor(message: string) {
    super(message)
  }
}
