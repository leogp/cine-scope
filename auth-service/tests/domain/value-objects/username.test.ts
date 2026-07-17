import { Username } from '../../../src/domain/value-objects/username'
import { InvalidUsernameError } from '../../../src/domain/errors/invalidUsernameError'

describe('Username', () => {
  it('accepts a valid username and preserves its value', () => {
    const username = new Username('leo_dev')

    expect(username.toString()).toBe('leo_dev')
  })

  it.each([
    ['contains a space', 'leo dev'],
    ['is shorter than 3 characters', 'ab'],
    ['is longer than 20 characters', 'a'.repeat(21)],
  ])('rejects a username that %s', (_reason, value) => {
    expect(() => new Username(value)).toThrow(InvalidUsernameError)
  })
})
