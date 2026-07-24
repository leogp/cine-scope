import { PersonName } from '../../../src/domain/value-objects/personName'
import { InvalidPersonNameError } from '../../../src/domain/errors/invalidPersonNameError'

describe('PersonName', () => {
  it('exposes a valid name', () => {
    expect(new PersonName('Greta Gerwig').value).toBe('Greta Gerwig')
  })

  it('accepts a name of exactly 255 characters', () => {
    const name = 'a'.repeat(255)

    expect(new PersonName(name).value).toBe(name)
  })

  it('rejects an empty string', () => {
    expect(() => new PersonName('')).toThrow(InvalidPersonNameError)
  })

  it('rejects a whitespace-only string', () => {
    expect(() => new PersonName('   ')).toThrow(InvalidPersonNameError)
  })

  it('rejects a name longer than 255 characters', () => {
    expect(() => new PersonName('a'.repeat(256))).toThrow(InvalidPersonNameError)
  })

  it('equals another PersonName with the same value', () => {
    expect(new PersonName('Greta Gerwig').equals(new PersonName('Greta Gerwig'))).toBe(true)
  })
})
