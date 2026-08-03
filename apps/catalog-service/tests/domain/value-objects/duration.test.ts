import { Duration } from '@catalog/domain/value-objects/duration'
import { InvalidDurationError } from '@catalog/domain/errors/invalidDurationError'

describe('Duration', () => {
  it('exposes the number of minutes', () => {
    expect(Duration.create(120).value).toBe(120)
  })

  it('accepts the lower boundary of one minute', () => {
    expect(Duration.create(1).value).toBe(1)
  })

  it('accepts the upper boundary of 1440 minutes', () => {
    expect(Duration.create(1440).value).toBe(1440)
  })

  it('rejects a non-integer duration', () => {
    expect(() => Duration.create(120.5)).toThrow(InvalidDurationError)
    expect(() => Duration.create(120.5)).toThrow('Duration must be an integer.')
  })

  it('rejects zero', () => {
    expect(() => Duration.create(0)).toThrow('Duration must be greater than zero.')
  })

  it('rejects a negative duration', () => {
    expect(() => Duration.create(-1)).toThrow(InvalidDurationError)
  })

  it('rejects a duration above 1440 minutes', () => {
    expect(() => Duration.create(1441)).toThrow('Duration is invalid.')
  })

  it('equals another Duration with the same value', () => {
    expect(Duration.create(90).equals(Duration.create(90))).toBe(true)
  })

  it('does not equal a Duration with a different value', () => {
    expect(Duration.create(90).equals(Duration.create(91))).toBe(false)
  })
})
