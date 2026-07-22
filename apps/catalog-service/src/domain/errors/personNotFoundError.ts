import { DomainError } from './domainError'

export class PersonNotFoundError extends DomainError {
  constructor() {
    super('Person not found.')
  }
}
