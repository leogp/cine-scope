import { DomainError } from './domainError'

export class InvalidCountryCodeError extends DomainError {
  constructor() {
    super('Invalid country code.')
  }
}
