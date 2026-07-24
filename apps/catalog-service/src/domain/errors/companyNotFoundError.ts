import { DomainError } from './domainError'

export class CompanyNotFoundError extends DomainError {
  constructor() {
    super('Company not found.')
  }
}
