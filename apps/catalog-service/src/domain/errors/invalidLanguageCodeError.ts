import { DomainError } from './domainError'

export class InvalidLanguageCodeError extends DomainError {
  constructor() {
    super('Invalid language code.')
  }
}
