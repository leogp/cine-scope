export interface GenreProps {
  id: string
  name: GenreName
  createdAt: Date
  updatedAt: Date
}

export type CreateGenreProps = Omit<GenreProps, 'id' | 'createdAt' | 'updatedAt'>

export class Genre {
  private constructor(private readonly props: GenreProps) {}

  static create(props: CreateGenreProps): Genre {
    return new Genre({
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...props,
    })
  }

  static restore(props: GenreProps): Genre {
    return new Genre(props)
  }

  get data(): Readonly<GenreProps> {
    return this.props
  }

  rename(name: GenreName): void {
    this.props.name = name
    this.props.updatedAt = new Date()
  }
}
