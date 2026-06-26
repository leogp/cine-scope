import { InvalidEmailError } from '../errors/invalidEmailError'

export class Email {
  private readonly value: string

  constructor(value: string) {
    if (!value.includes('@')) {
      throw new InvalidEmailError()
    }

    this.value = value
  }

  toString(): string {
    return this.value
  }
}
