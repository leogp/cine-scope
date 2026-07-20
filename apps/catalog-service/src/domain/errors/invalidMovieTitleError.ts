import { DomainError } from './domainError'

export class InvalidMovieTitleError extends DomainError {
  constructor() {
    super('Invalid movie title.')
  }
}
