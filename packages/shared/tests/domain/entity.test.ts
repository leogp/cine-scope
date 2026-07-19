import { Entity, EntityProps, TimestampedProps } from '../../src/domain/entity'

interface StubProps extends EntityProps, TimestampedProps {
  name: string
}

class StubEntity extends Entity<StubProps> {
  constructor(props: StubProps) {
    super(props)
  }

  get name(): string {
    return this.props.name
  }

  get updatedAt(): Date {
    return this.props.updatedAt
  }

  rename(name: string): void {
    this.props.name = name
    this.touch()
  }
}

class AnotherEntity extends Entity<EntityProps> {
  constructor(id: string) {
    super({ id })
  }
}

const buildProps = (overrides: Partial<StubProps> = {}): StubProps => ({
  id: 'entity-1',
  name: 'original',
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
  ...overrides,
})

describe('Entity', () => {
  it('exposes its id', () => {
    const entity = new StubEntity(buildProps())

    expect(entity.id).toBe('entity-1')
  })

  it('equals another entity of the same type with the same id', () => {
    const a = new StubEntity(buildProps())
    const b = new StubEntity(buildProps({ name: 'different state' }))

    expect(a.equals(b)).toBe(true)
  })

  it('does not equal an entity with a different id', () => {
    const a = new StubEntity(buildProps())
    const b = new StubEntity(buildProps({ id: 'entity-2' }))

    expect(a.equals(b)).toBe(false)
  })

  it('does not equal an entity of a different concrete type with the same id', () => {
    const a = new StubEntity(buildProps())
    const b = new AnotherEntity('entity-1')

    expect(a.equals(b)).toBe(false)
  })

  it('does not equal undefined', () => {
    const entity = new StubEntity(buildProps())

    expect(entity.equals(undefined)).toBe(false)
  })

  it('touch() refreshes updatedAt on mutation', () => {
    const entity = new StubEntity(buildProps())
    const before = entity.updatedAt

    entity.rename('renamed')

    expect(entity.name).toBe('renamed')
    expect(entity.updatedAt.getTime()).toBeGreaterThan(before.getTime())
  })
})
