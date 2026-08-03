import { buildErrorHandler } from '@cinescope/shared/infrastructure/http'

import { CompanyNotFoundError } from '../../../domain/errors/companyNotFoundError'
import { DomainError } from '../../../domain/errors/domainError'
import { GenreAlreadyExistsError } from '../../../domain/errors/genreAlreadyExistsError'
import { GenreNotFoundError } from '../../../domain/errors/genreNotFoundError'
import { MovieNotFoundError } from '../../../domain/errors/movieNotFoundError'
import { PersonNotFoundError } from '../../../domain/errors/personNotFoundError'
import { SeriesNotFoundError } from '../../../domain/errors/seriesNotFoundError'

function statusFor(err: Error): number | undefined {
  if (
    err instanceof MovieNotFoundError ||
    err instanceof SeriesNotFoundError ||
    err instanceof GenreNotFoundError ||
    err instanceof CompanyNotFoundError ||
    err instanceof PersonNotFoundError
  ) {
    return 404
  }

  // Must precede the DomainError branch below, which would otherwise claim it
  if (err instanceof GenreAlreadyExistsError) {
    return 409
  }

  // Remaining domain errors are invariant violations on caller-supplied data
  if (err instanceof DomainError) {
    return 400
  }

  return undefined
}

export const errorHandler = buildErrorHandler(statusFor)
