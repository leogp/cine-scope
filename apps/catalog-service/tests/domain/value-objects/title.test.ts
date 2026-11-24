import { Title } from '@catalog/domain/value-objects/title'
import { InvalidTitleError } from '@catalog/domain/errors/invalidTitleError'

describe('Title', () => {
  it('exposes a valid title', () => {
    expect(new Title('Lady Bird').value).toBe('Lady Bird')
  })

  it('accepts a title of exactly 255 characters', () => {
    const title = 'a'.repeat(255)

    expect(new Title(title).value).toBe(title)
  })

  it('rejects an empty string', () => {
    expect(() => new Title('')).toThrow(InvalidTitleError)
  })

  it('rejects a whitespace-only string', () => {
    expect(() => new Title('   ')).toThrow(InvalidTitleError)
  })

  it('rejects a title longer than 255 characters', () => {
    expect(() => new Title('a'.repeat(256))).toThrow(InvalidTitleError)
  })

  it('equals another Title with the same value', () => {
    expect(new Title('Fleabag').equals(new Title('Fleabag'))).toBe(true)
  })
})
