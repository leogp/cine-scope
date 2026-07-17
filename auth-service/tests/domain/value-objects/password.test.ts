import { Password } from '../../../src/domain/value-objects/password'
import { InvalidPasswordError } from '../../../src/domain/errors/invalidPasswordError'

describe('Password', () => {
  it('accepts a password that satisfies the policy', () => {
    const password = new Password('Str0ng!Pass')

    expect(password.toString()).toBe('Str0ng!Pass')
  })

  it.each([
    ['is shorter than 8 characters', 'S1!a', 'at least 8 characters'],
    ['has no uppercase letter', 'str0ng!pass', 'uppercase letter'],
    ['has no lowercase letter', 'STR0NG!PASS', 'lowercase letter'],
    ['has no number', 'Strong!Pass', 'number'],
    ['has no special character', 'Str0ngPass', 'special character'],
  ])('rejects a password that %s', (_reason, value, messagePart) => {
    expect(() => new Password(value)).toThrow(InvalidPasswordError)
    expect(() => new Password(value)).toThrow(messagePart)
  })
})
