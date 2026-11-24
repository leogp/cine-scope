import { ValueObject } from '@cinescope/shared/domain'
import { InvalidTitleError } from '../errors/invalidTitleError'

export class Title extends ValueObject<string> {
  constructor(value: string) {
    if (value.trim() === '' || value.length < 1 || value.length > 255) {
      throw new InvalidTitleError()
    }

    super(value)
  }
}
