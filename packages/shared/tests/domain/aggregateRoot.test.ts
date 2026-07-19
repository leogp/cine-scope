import { AggregateRoot } from '../../src/domain/aggregateRoot'
import { EntityProps } from '../../src/domain/entity'

class StubAggregate extends AggregateRoot<EntityProps> {
  constructor(id: string) {
    super({ id })
  }

  doSomething(): void {
    this.addDomainEvent({
      eventName: 'stub.something.happened',
      aggregateId: this.id,
      occurredAt: new Date(),
    })
  }
}

describe('AggregateRoot', () => {
  it('records domain events in order', () => {
    const aggregate = new StubAggregate('agg-1')

    aggregate.doSomething()
    aggregate.doSomething()

    const events = aggregate.pullDomainEvents()

    expect(events).toHaveLength(2)
    expect(events[0].eventName).toBe('stub.something.happened')
    expect(events[0].aggregateId).toBe('agg-1')
  })

  it('pullDomainEvents clears the buffer', () => {
    const aggregate = new StubAggregate('agg-1')

    aggregate.doSomething()
    aggregate.pullDomainEvents()

    expect(aggregate.pullDomainEvents()).toHaveLength(0)
  })

  it('starts with no events', () => {
    const aggregate = new StubAggregate('agg-1')

    expect(aggregate.pullDomainEvents()).toHaveLength(0)
  })
})
