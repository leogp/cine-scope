import { ValueObject } from '@cinescope/shared/domain'
import { InvalidPersonNameError } from '../errors/invalidPersonNameError'

export class PersonName extends ValueObject<string> {
  constructor(value: string) {
    if (value.trim() === '' || value.length < 1 || value.length > 255) {
      throw new InvalidPersonNameError()
    }

    super(value)
  }
}
