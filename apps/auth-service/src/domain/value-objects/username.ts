import { ValueObject } from '@cinescope/shared/domain'
import { InvalidUsernameError } from '../errors/invalidUsernameError'

export class Username extends ValueObject<string> {
  constructor(value: string) {
    if (value.includes(' ') || value.trim() === '' || value.length < 3 || value.length > 20) {
      throw new InvalidUsernameError()
    }

    super(value)
  }
}
