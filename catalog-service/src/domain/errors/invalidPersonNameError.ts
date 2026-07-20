import { DomainError } from './domainError'

export class InvalidPersonNameError extends DomainError {
  constructor() {
    super('Invalid person name.')
  }
}
