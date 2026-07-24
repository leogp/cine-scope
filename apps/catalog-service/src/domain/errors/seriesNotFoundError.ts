import { DomainError } from './domainError'

export class SeriesNotFoundError extends DomainError {
  constructor() {
    super('Series not found.')
  }
}
