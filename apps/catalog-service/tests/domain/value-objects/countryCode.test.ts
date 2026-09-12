import { CountryCode } from '@catalog/domain/value-objects/countryCode'
import { InvalidCountryCodeError } from '@catalog/domain/errors/invalidCountryCodeError'

describe('CountryCode', () => {
  it('accepts a valid ISO 3166-1 alpha-2 code', () => {
    expect(new CountryCode('US').value).toBe('US')
  })

  it('rejects a lowercase code', () => {
    expect(() => new CountryCode('us')).toThrow(InvalidCountryCodeError)
  })

  it('rejects a code that is not two letters', () => {
    expect(() => new CountryCode('USA')).toThrow(InvalidCountryCodeError)
    expect(() => new CountryCode('U')).toThrow(InvalidCountryCodeError)
  })

  it('rejects a code containing non-letter characters', () => {
    expect(() => new CountryCode('U1')).toThrow(InvalidCountryCodeError)
  })

  it('rejects an empty string', () => {
    expect(() => new CountryCode('')).toThrow(InvalidCountryCodeError)
  })

  it('equals another CountryCode with the same value', () => {
    expect(new CountryCode('FR').equals(new CountryCode('FR'))).toBe(true)
  })
})
