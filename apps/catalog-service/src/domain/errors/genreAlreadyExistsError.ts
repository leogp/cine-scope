import { DomainError } from './domainError'

export class GenreAlreadyExistsError extends DomainError {
  constructor(name: string) {
    super(`Genre '${name}' already exists.`)
  }
}
