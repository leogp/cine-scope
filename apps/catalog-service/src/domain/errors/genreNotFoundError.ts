import { DomainError } from './domainError'

export class GenreNotFoundError extends DomainError {
  constructor() {
    super('Genre not found.')
  }
}
