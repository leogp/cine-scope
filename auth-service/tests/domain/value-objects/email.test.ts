import { Email } from '../../../src/domain/value-objects/email'
import { InvalidEmailError } from '../../../src/domain/errors/invalidEmailError'

describe('Email', () => {
  it('accepts a valid email and preserves its value', () => {
    const email = new Email('leo@example.com')

    expect(email.toString()).toBe('leo@example.com')
  })

  it('rejects a value without an @', () => {
    expect(() => new Email('not-an-email')).toThrow(InvalidEmailError)
  })
})
