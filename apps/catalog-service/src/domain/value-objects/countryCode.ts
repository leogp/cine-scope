import { ValueObject } from '@cinescope/shared/domain'
import { InvalidCountryCodeError } from '../errors/invalidCountryCodeError'

const ISO_3166_1_ALPHA_2_PATTERN = /^[A-Z]{2}$/

export class CountryCode extends ValueObject<string> {
  constructor(value: string) {
    if (!ISO_3166_1_ALPHA_2_PATTERN.test(value)) {
      throw new InvalidCountryCodeError()
    }

    super(value)
  }
}
