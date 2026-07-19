import { DomainEvent } from './domainEvent'
import { Entity, EntityProps } from './entity'

export abstract class AggregateRoot<Props extends EntityProps> extends Entity<Props> {
  private readonly domainEvents: DomainEvent[] = []

  protected addDomainEvent(event: DomainEvent): void {
    this.domainEvents.push(event)
  }

  /**
   * Returns the recorded events and clears the buffer, so callers can publish
   * them after the aggregate has been persisted.
   */
  pullDomainEvents(): DomainEvent[] {
    const events = [...this.domainEvents]
    this.domainEvents.length = 0

    return events
  }
}
