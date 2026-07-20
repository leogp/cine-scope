import { DomainError } from './domainError'

export class EmailAlreadyExistsError extends DomainError {
  constructor(email: string) {
    super(`Email '${email}' already exists.`)
  }
}
