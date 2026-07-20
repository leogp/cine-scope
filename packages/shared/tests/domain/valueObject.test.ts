import { ValueObject } from '../../src/domain/valueObject'

class StubName extends ValueObject<string> {
  constructor(value: string) {
    super(value)
  }
}

class OtherName extends ValueObject<string> {
  constructor(value: string) {
    super(value)
  }
}

describe('ValueObject', () => {
  it('exposes its value', () => {
    const name = new StubName('leo')

    expect(name.value).toBe('leo')
  })

  it('equals another value object of the same type with the same value', () => {
    expect(new StubName('leo').equals(new StubName('leo'))).toBe(true)
  })

  it('does not equal a value object with a different value', () => {
    expect(new StubName('leo').equals(new StubName('other'))).toBe(false)
  })

  it('does not equal a value object of a different concrete type', () => {
    expect(new StubName('leo').equals(new OtherName('leo'))).toBe(false)
  })

  it('does not equal undefined', () => {
    expect(new StubName('leo').equals(undefined)).toBe(false)
  })

  it('toString() returns the string representation', () => {
    expect(new StubName('leo').toString()).toBe('leo')
  })
})
