import { DomainError } from './domainError'

export class RoleNotFoundError extends DomainError {
  constructor() {
    super('Role not found.')
  }
}
