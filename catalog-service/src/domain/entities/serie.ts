import { AggregateRoot, EntityProps } from '@cinescope/shared/domain'
import { LanguageCode } from '../value-objects/languageCode'
import { MovieTitle } from '../value-objects/movieTitle'
import { Company } from './company'
import { ExternalReference } from './externalReference'
import { Genre } from './genre'
import { Person } from './person'

export interface SeriesProps extends EntityProps {
  id: string
  title: MovieTitle
  overview: string | null
  firstAirDate: Date | null
  lastAirDate: Date | null
  originalLanguage: LanguageCode
  posterPath: string | null
  backdropPath: string | null
  genres: Genre[]
  cast: Person[]
  directors: Person[]
  productionCompanies: Company[]
  externalReferences: ExternalReference[]
  createdAt: Date
  updatedAt: Date
}

export type CreateSeriesProps = Omit<SeriesProps, 'id' | 'createdAt' | 'updatedAt'>

export class Series extends AggregateRoot<SeriesProps> {
  private constructor(props: SeriesProps) {
    super(props)
  }

  static create(props: CreateSeriesProps): Series {
    return new Series({
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...props,
    })
  }

  static restore(props: SeriesProps): Series {
    return new Series(props)
  }

  changeTitle(title: MovieTitle): void {
    this.props.title = title
    this.touch()
  }
}
