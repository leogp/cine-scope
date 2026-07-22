import { ValueObject } from '@cinescope/shared/domain'
import { InvalidDurationError } from '../errors/invalidDurationError'

export class Duration extends ValueObject<number> {
  private constructor(value: number) {
    super(value)
  }

  static create(minutes: number): Duration {
    if (!Number.isInteger(minutes)) {
      throw new InvalidDurationError('Duration must be an integer.')
    }

    if (minutes <= 0) {
      throw new InvalidDurationError('Duration must be greater than zero.')
    }

    if (minutes > 1440) {
      throw new InvalidDurationError('Duration is invalid.')
    }

    return new Duration(minutes)
  }
}
