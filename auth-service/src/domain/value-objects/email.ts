import { ValueObject } from '@cinescope/shared/domain'
import { InvalidEmailError } from '../errors/invalidEmailError'

export class Email extends ValueObject<string> {
  constructor(value: string) {
    if (!value.includes('@')) {
      throw new InvalidEmailError()
    }

    super(value)
  }
}
