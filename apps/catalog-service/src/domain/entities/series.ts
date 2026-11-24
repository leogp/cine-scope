import { AggregateRoot, EntityProps } from '@cinescope/shared/domain'
import { LanguageCode } from '../value-objects/languageCode'
import { Title } from '../value-objects/title'
import { Company } from './company'
import { Genre } from './genre'
import { Person } from './person'

export interface SeriesProps extends EntityProps {
  title: Title
  overview: string | null
  firstAirDate: Date | null
  lastAirDate: Date | null
  originalLanguage: LanguageCode
  posterPath: string | null
  backdropPath: string | null
  // readonly at the type level: external readers (via `data`) cannot mutate
  // the collections; the set methods reassign instead of pushing.
  genres: readonly Genre[]
  cast: readonly Person[]
  directors: readonly Person[]
  productionCompanies: readonly Company[]
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

  changeTitle(title: Title): void {
    this.props.title = title
    this.touch()
  }

  changeOverview(overview: string | null): void {
    this.props.overview = overview
    this.touch()
  }

  changeFirstAirDate(firstAirDate: Date | null): void {
    this.props.firstAirDate = firstAirDate
    this.touch()
  }

  changeLastAirDate(lastAirDate: Date | null): void {
    this.props.lastAirDate = lastAirDate
    this.touch()
  }

  changeOriginalLanguage(originalLanguage: LanguageCode): void {
    this.props.originalLanguage = originalLanguage
    this.touch()
  }

  changePosterPath(posterPath: string | null): void {
    this.props.posterPath = posterPath
    this.touch()
  }

  changeBackdropPath(backdropPath: string | null): void {
    this.props.backdropPath = backdropPath
    this.touch()
  }

  setGenres(genres: Genre[]): void {
    this.props.genres = [...genres]
    this.touch()
  }

  setCast(cast: Person[]): void {
    this.props.cast = [...cast]
    this.touch()
  }

  setDirectors(directors: Person[]): void {
    this.props.directors = [...directors]
    this.touch()
  }

  setProductionCompanies(companies: Company[]): void {
    this.props.productionCompanies = [...companies]
    this.touch()
  }
}
