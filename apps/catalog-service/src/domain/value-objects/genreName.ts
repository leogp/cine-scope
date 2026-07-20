import { ValueObject } from '@cinescope/shared/domain'
import { InvalidGenreNameError } from '../errors/invalidGenreNameError'

export class GenreName extends ValueObject<string> {
  constructor(value: string) {
    if (value.trim() === '' || value.length < 1 || value.length > 255) {
      throw new InvalidGenreNameError()
    }

    super(value)
  }
}
