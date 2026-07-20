import { ValueObject } from '@cinescope/shared/domain'
import { InvalidCompanyNameError } from '../errors/invalidCompanyNameError'

export class CompanyName extends ValueObject<string> {
  constructor(value: string) {
    if (value.trim() === '' || value.length < 1 || value.length > 255) {
      throw new InvalidCompanyNameError()
    }

    super(value)
  }
}
