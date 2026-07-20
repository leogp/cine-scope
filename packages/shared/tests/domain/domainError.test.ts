import { DomainError } from '../../src/domain/domainError'

class StubNotFoundError extends DomainError {
  constructor() {
    super('stub not found')
  }
}

describe('DomainError', () => {
  it('sets name to the concrete class name', () => {
    const error = new StubNotFoundError()

    expect(error.name).toBe('StubNotFoundError')
    expect(error.message).toBe('stub not found')
  })

  it('supports instanceof checks against the base class', () => {
    expect(new StubNotFoundError()).toBeInstanceOf(DomainError)
    expect(new StubNotFoundError()).toBeInstanceOf(Error)
  })
})
