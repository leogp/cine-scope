import { AggregateRoot, EntityProps } from '@cinescope/shared/domain'
import { GenreName } from '../value-objects/genreName'

export interface GenreProps extends EntityProps {
  id: string
  name: GenreName
  createdAt: Date
  updatedAt: Date
}

export type CreateGenreProps = Omit<GenreProps, 'id' | 'createdAt' | 'updatedAt'>

export class Genre extends AggregateRoot<GenreProps> {
  private constructor(props: GenreProps) {
    super(props)
  }

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

  rename(name: GenreName): void {
    this.props.name = name
    this.props.updatedAt = new Date()
  }
}
