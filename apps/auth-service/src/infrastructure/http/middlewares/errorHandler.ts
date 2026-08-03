import { buildErrorHandler } from '@cinescope/shared/infrastructure/http'

import { ApplicationError } from '../../../application/errors/applicationError'
import { InvalidCredentialsError } from '../../../application/errors/invalidCredentialsError'
import { InvalidRefreshTokenError } from '../../../application/errors/invalidRefreshTokenError'
import { RefreshTokenExpiredError } from '../../../application/errors/refreshTokenExpiredError'
import { RefreshTokenRevokedError } from '../../../application/errors/refreshTokenRevokeError'
import { DomainError } from '../../../domain/errors/domainError'
import { EmailAlreadyExistsError } from '../../../domain/errors/emailAlreadyExistsError'
import { RoleNotFoundError } from '../../../domain/errors/roleNotFoundError'
import { UserNotFoundError } from '../../../domain/errors/userNotFoundError'
import { UsernameAlreadyExistsError } from '../../../domain/errors/usernameAlreadyExistsError'

function statusFor(err: Error): number | undefined {
  if (err instanceof EmailAlreadyExistsError || err instanceof UsernameAlreadyExistsError) {
    return 409
  }

  // A UserNotFoundError escaping login/refresh enables user enumeration —
  // 401 would be stricter; 404 accepted for this learning project
  if (err instanceof UserNotFoundError || err instanceof RoleNotFoundError) {
    return 404
  }

  if (
    err instanceof InvalidCredentialsError ||
    err instanceof InvalidRefreshTokenError ||
    err instanceof RefreshTokenExpiredError ||
    err instanceof RefreshTokenRevokedError
  ) {
    return 401
  }

  if (err instanceof DomainError || err instanceof ApplicationError) {
    return 400
  }

  return undefined
}

export const errorHandler = buildErrorHandler(statusFor)
