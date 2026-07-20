import { ValueObject } from '@cinescope/shared/domain'
import { InvalidMovieTitleError } from '../errors/invalidMovieTitleError'

export class MovieTitle extends ValueObject<string> {
  constructor(value: string) {
    if (value.trim() === '' || value.length < 1 || value.length > 255) {
      throw new InvalidMovieTitleError()
    }

    super(value)
  }
}
