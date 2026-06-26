import { DomainError } from './domainError'

export class UsernameAlreadyExistsError extends DomainError {
  constructor(username: string) {
    super(`Username '${username}' already exists.`)
  }
}
