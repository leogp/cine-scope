import { InvalidPasswordError } from '../errors/invalidPasswordError'

export class Password {
  private readonly value: string

  constructor(value: string) {
    this.validate(value)
    this.value = value
  }

  private validate(value: string): void {
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

  toString(): string {
    return this.value
  }
}
