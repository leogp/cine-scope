import { CompanyName } from '@catalog/domain/value-objects/companyName'
import { InvalidCompanyNameError } from '@catalog/domain/errors/invalidCompanyNameError'

describe('CompanyName', () => {
  it('exposes a valid name', () => {
    expect(new CompanyName('A24').value).toBe('A24')
  })

  it('accepts a name of exactly 255 characters', () => {
    const name = 'a'.repeat(255)

    expect(new CompanyName(name).value).toBe(name)
  })

  it('rejects an empty string', () => {
    expect(() => new CompanyName('')).toThrow(InvalidCompanyNameError)
  })

  it('rejects a whitespace-only string', () => {
    expect(() => new CompanyName('   ')).toThrow(InvalidCompanyNameError)
  })

  it('rejects a name longer than 255 characters', () => {
    expect(() => new CompanyName('a'.repeat(256))).toThrow(InvalidCompanyNameError)
  })

  it('equals another CompanyName with the same value', () => {
    expect(new CompanyName('A24').equals(new CompanyName('A24'))).toBe(true)
  })
})
