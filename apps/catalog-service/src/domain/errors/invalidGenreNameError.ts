import { DomainError } from './domainError'

export class InvalidGenreNameError extends DomainError {
  constructor() {
    super('Invalid genre name.')
  }
}
