import { LanguageCode } from '@catalog/domain/value-objects/languageCode'
import { InvalidLanguageCodeError } from '@catalog/domain/errors/invalidLanguageCodeError'

describe('LanguageCode', () => {
  it('accepts a valid ISO 639-1 code', () => {
    expect(new LanguageCode('en').value).toBe('en')
  })

  it('rejects an uppercase code', () => {
    expect(() => new LanguageCode('EN')).toThrow(InvalidLanguageCodeError)
  })

  it('rejects a code that is not two letters', () => {
    expect(() => new LanguageCode('eng')).toThrow(InvalidLanguageCodeError)
    expect(() => new LanguageCode('e')).toThrow(InvalidLanguageCodeError)
  })

  it('rejects a code containing non-letter characters', () => {
    expect(() => new LanguageCode('e1')).toThrow(InvalidLanguageCodeError)
  })

  it('rejects an empty string', () => {
    expect(() => new LanguageCode('')).toThrow(InvalidLanguageCodeError)
  })

  it('equals another LanguageCode with the same value', () => {
    expect(new LanguageCode('fr').equals(new LanguageCode('fr'))).toBe(true)
  })
})
