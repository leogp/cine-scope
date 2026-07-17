export interface PersonProps {
  id: string
  name: PersonName
  biography: string | null
  birthDate: Date | null
  profilePath: string | null
  externalReferences: ExternalReference[]
  createdAt: Date
  updatedAt: Date
}

export type CreatePersonProps = Omit<PersonProps, 'id' | 'createdAt' | 'updatedAt'>

// It can be a director, actor, producer, etc.
export class Person {
  private constructor(private readonly props: PersonProps) {}

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

  get data(): Readonly<PersonProps> {
    return this.props
  }

  changeName(name: PersonName): void {
    this.props.name = name
    this.props.updatedAt = new Date()
  }

  addExternalReference(reference: ExternalReference): void {
    this.props.externalReferences.push(reference)
    this.props.updatedAt = new Date()
  }
}
