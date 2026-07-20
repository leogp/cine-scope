import { DomainError } from './domainError'

export class InvalidExternalResourceTypeError extends DomainError {
  constructor() {
    super('Invalid external resource type.')
  }
}
