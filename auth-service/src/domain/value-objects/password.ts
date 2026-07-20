import { ValueObject } from '@cinescope/shared/domain'
import { InvalidPasswordError } from '../errors/invalidPasswordError'

export class Password extends ValueObject<string> {
  constructor(value: string) {
    // Static so validation can run before super() without touching `this`.
    Password.validate(value)

    super(value)
  }

  private static validate(value: string): void {
    if (value.length < 8) {
      throw new InvalidPasswordError('Password must contain at least 8 characters.')
    }

    if (!/[A-Z]/.test(value)) {
      throw new InvalidPasswordError('Password must contain at least one uppercase letter.')
    }

    if (!/[a-z]/.test(value)) {
      throw new InvalidPasswordError('Password must contain at least one lowercase letter.')
    }

    if (!/[0-9]/.test(value)) {
      throw new InvalidPasswordError('Password must contain at least one number.')
    }

    if (!/[!@#$%^&*(),.?":{}|<>_\-+=\\[\]/]/.test(value)) {
      throw new InvalidPasswordError('Password must contain at least one special character.')
    }
  }
}
