import { DomainError } from './domainError'

export class InvalidExternalIdError extends DomainError {
  constructor(message: string) {
    super(message)
  }
}
