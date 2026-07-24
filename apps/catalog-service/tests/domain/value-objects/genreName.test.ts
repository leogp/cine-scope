import { GenreName } from '../../../src/domain/value-objects/genreName'
import { InvalidGenreNameError } from '../../../src/domain/errors/invalidGenreNameError'

describe('GenreName', () => {
  it('exposes a valid name', () => {
    expect(new GenreName('Drama').value).toBe('Drama')
  })

  it('accepts a name of exactly 255 characters', () => {
    const name = 'a'.repeat(255)

    expect(new GenreName(name).value).toBe(name)
  })

  it('rejects an empty string', () => {
    expect(() => new GenreName('')).toThrow(InvalidGenreNameError)
  })

  it('rejects a whitespace-only string', () => {
    expect(() => new GenreName('   ')).toThrow(InvalidGenreNameError)
  })

  it('rejects a name longer than 255 characters', () => {
    expect(() => new GenreName('a'.repeat(256))).toThrow(InvalidGenreNameError)
  })

  it('equals another GenreName with the same value', () => {
    expect(new GenreName('Drama').equals(new GenreName('Drama'))).toBe(true)
  })
})
