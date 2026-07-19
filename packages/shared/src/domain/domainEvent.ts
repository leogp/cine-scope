export interface DomainEvent {
  /** Dot-namespaced name, e.g. `catalog.movie.created`. */
  readonly eventName: string
  readonly aggregateId: string
  readonly occurredAt: Date
}
