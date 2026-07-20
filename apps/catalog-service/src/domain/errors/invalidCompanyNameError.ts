import { DomainError } from './domainError'

export class InvalidCompanyNameError extends DomainError {
  constructor() {
    super('Invalid company name.')
  }
}
