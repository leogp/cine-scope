import { InvalidUsernameError } from '../errors/invalidUsernameError'

export class Username {
  private readonly value: string

  constructor(value: string) {
    if (!value.includes(' ') || value.trim() === '' || value.length < 3 || value.length > 20) {
      throw new InvalidUsernameError()
    }

    this.value = value
  }

  toString(): string {
    return this.value
  }
}
