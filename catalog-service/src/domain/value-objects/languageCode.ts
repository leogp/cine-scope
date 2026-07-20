import { ValueObject } from '@cinescope/shared/domain'
import { InvalidLanguageCodeError } from '../errors/invalidLanguageCodeError'

const ISO_639_1_PATTERN = /^[a-z]{2}$/

export class LanguageCode extends ValueObject<string> {
  constructor(value: string) {
    if (!ISO_639_1_PATTERN.test(value)) {
      throw new InvalidLanguageCodeError()
    }

    super(value)
  }
}
