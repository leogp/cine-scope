import { DomainError } from './domainError'

export class InvalidDurationError extends DomainError {
  constructor(message: string) {
    super(message)
  }
}
