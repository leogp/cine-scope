import { AggregateRoot, EntityProps } from '@cinescope/shared/domain'
import { LanguageCode } from '../value-objects/languageCode'
import { MovieTitle } from '../value-objects/movieTitle'
import { Company } from './company'
import { Genre } from './genre'
import { Person } from './person'
import { Duration } from '../value-objects/duration'

export interface MovieProps extends EntityProps {
  title: MovieTitle
  overview: string | null
  releaseDate: Date | null
  duration: Duration | null
  originalLanguage: LanguageCode
  posterPath: string | null
  backdropPath: string | null
  // readonly at the type level: external readers (via `data`) cannot mutate
  // the collections; the add/remove methods reassign instead of pushing.
  genres: readonly Genre[]
  cast: readonly Person[]
  directors: readonly Person[]
  productionCompanies: readonly Company[]
  createdAt: Date
  updatedAt: Date
}

export type CreateMovieProps = Omit<MovieProps, 'id' | 'createdAt' | 'updatedAt'>

export class Movie extends AggregateRoot<MovieProps> {
  private constructor(props: MovieProps) {
    super(props)
  }

  static create(props: CreateMovieProps): Movie {
    return new Movie({
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...props,
    })
  }

  static restore(props: MovieProps): Movie {
    return new Movie(props)
  }

  changeTitle(title: MovieTitle): void {
    this.props.title = title
    this.touch()
  }

  changeOverview(overview: string | null): void {
    this.props.overview = overview
    this.touch()
  }

  addGenre(genre: Genre): void {
    if (this.props.genres.some((g) => g.equals(genre))) return

    this.props.genres = [...this.props.genres, genre]
    this.touch()
  }

  removeGenre(genreId: string): void {
    this.props.genres = this.props.genres.filter((g) => g.id !== genreId)

    this.touch()
  }

  addCastMember(person: Person): void {
    if (this.props.cast.some((p) => p.equals(person))) return

    this.props.cast = [...this.props.cast, person]
    this.touch()
  }

  addDirector(person: Person): void {
    if (this.props.directors.some((p) => p.equals(person))) return

    this.props.directors = [...this.props.directors, person]
    this.touch()
  }

  addProductionCompany(company: Company): void {
    if (this.props.productionCompanies.some((c) => c.equals(company))) {
      return
    }

    this.props.productionCompanies = [...this.props.productionCompanies, company]
    this.touch()
  }
}
