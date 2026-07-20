import { DomainError } from './domainError'

export class InvalidExternalProviderError extends DomainError {
  constructor() {
    super('Invalid external provider.')
  }
}
