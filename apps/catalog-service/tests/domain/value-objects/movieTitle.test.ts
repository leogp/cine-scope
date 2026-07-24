import { MovieTitle } from '../../../src/domain/value-objects/movieTitle'
import { InvalidMovieTitleError } from '../../../src/domain/errors/invalidMovieTitleError'

describe('MovieTitle', () => {
  it('exposes a valid title', () => {
    expect(new MovieTitle('Lady Bird').value).toBe('Lady Bird')
  })

  it('accepts a title of exactly 255 characters', () => {
    const title = 'a'.repeat(255)

    expect(new MovieTitle(title).value).toBe(title)
  })

  it('rejects an empty string', () => {
    expect(() => new MovieTitle('')).toThrow(InvalidMovieTitleError)
  })

  it('rejects a whitespace-only string', () => {
    expect(() => new MovieTitle('   ')).toThrow(InvalidMovieTitleError)
  })

  it('rejects a title longer than 255 characters', () => {
    expect(() => new MovieTitle('a'.repeat(256))).toThrow(InvalidMovieTitleError)
  })

  it('equals another MovieTitle with the same value', () => {
    expect(new MovieTitle('Fleabag').equals(new MovieTitle('Fleabag'))).toBe(true)
  })
})
