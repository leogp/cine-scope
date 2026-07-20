import { ValueObject } from '@cinescope/shared/domain'
import { InvalidExternalIdError } from '../errors/invalidExternalIdError'

export class ExternalId extends ValueObject<string> {
  private constructor(value: string) {
    super(value)
  }

  static create(id: string): ExternalId {
    const value = id.trim()

    if (value.length === 0) {
      throw new InvalidExternalIdError('External id cannot be empty.')
    }

    if (value.length > 100) {
      throw new InvalidExternalIdError('External id is too long.')
    }

    return new ExternalId(value)
  }
}
