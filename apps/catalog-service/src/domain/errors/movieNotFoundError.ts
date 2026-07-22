import { DomainError } from './domainError'

export class MovieNotFoundError extends DomainError {
  constructor() {
    super('Movie not found.')
  }
}
