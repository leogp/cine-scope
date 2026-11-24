import { DomainError } from './domainError'

export class InvalidTitleError extends DomainError {
  constructor() {
    super('Invalid title.')
  }
}
