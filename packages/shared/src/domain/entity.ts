export interface EntityProps {
  id: string
}

export interface TimestampedProps {
  createdAt: Date
  updatedAt: Date
}

export abstract class Entity<Props extends EntityProps> {
  protected constructor(protected readonly props: Props) {}

  get id(): string {
    return this.props.id
  }

  /**
   * Identity-based equality: two entities are the same if they are the same
   * concrete type and share the same id.
   */
  equals(other?: Entity<EntityProps>): boolean {
    if (other === undefined || other === null) {
      return false
    }

    if (this === other) {
      return true
    }

    if (other.constructor !== this.constructor) {
      return false
    }

    return this.id === other.id
  }

  // The `this` parameter makes touch() available only to entities whose
  // props carry timestamps.
  protected touch(this: Entity<Props & TimestampedProps>): void {
    this.props.updatedAt = new Date()
  }
}
