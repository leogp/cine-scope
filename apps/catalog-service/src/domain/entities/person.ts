import { AggregateRoot, EntityProps } from '@cinescope/shared/domain'
import { PersonName } from '../value-objects/personName'
import { ExternalReference } from './externalReference'

export interface PersonProps extends EntityProps {
  name: PersonName
  biography: string | null
  birthDate: Date | null
  profilePath: string | null
  // readonly at the type level: addExternalReference reassigns, not pushes.
  externalReferences: readonly ExternalReference[]
  createdAt: Date
  updatedAt: Date
}

export type CreatePersonProps = Omit<PersonProps, 'id' | 'createdAt' | 'updatedAt'>

// It can be a director, actor, producer, etc.
export class Person extends AggregateRoot<PersonProps> {
  private constructor(props: PersonProps) {
    super(props)
  }

  static create(props: CreatePersonProps): Person {
    return new Person({
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...props,
    })
  }

  static restore(props: PersonProps): Person {
    return new Person(props)
  }

  changeName(name: PersonName): void {
    this.props.name = name
    this.touch()
  }

  addExternalReference(reference: ExternalReference): void {
    this.props.externalReferences = [...this.props.externalReferences, reference]
    this.touch()
  }
}
