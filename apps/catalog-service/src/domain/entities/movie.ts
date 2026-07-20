import { AggregateRoot, EntityProps } from '@cinescope/shared/domain'
import { LanguageCode } from '../value-objects/languageCode'
import { MovieTitle } from '../value-objects/movieTitle'
import { Company } from './company'
import { ExternalReference } from './externalReference'
import { Genre } from './genre'
import { Person } from './person'
import { Duration } from '../value-objects/runtime'

export interface MovieProps extends EntityProps {
  id: string
  title: MovieTitle
  overview: string | null
  releaseDate: Date | null
  duration: Duration | null
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
    if (this.props.genres.some((g) => g.data.id === genre.data.id)) return

    this.props.genres.push(genre)
    this.touch()
  }

  removeGenre(genreId: string): void {
    this.props.genres = this.props.genres.filter((g) => g.data.id !== genreId)

    this.touch()
  }

  addCastMember(person: Person): void {
    if (this.props.cast.some((p) => p.data.id === person.data.id)) return

    this.props.cast.push(person)
    this.touch()
  }

  addDirector(person: Person): void {
    if (this.props.directors.some((p) => p.data.id === person.data.id)) return

    this.props.directors.push(person)
    this.touch()
  }

  addProductionCompany(company: Company): void {
    if (this.props.productionCompanies.some((c) => c.data.id === company.data.id)) {
      return
    }

    this.props.productionCompanies.push(company)
    this.touch()
  }

  addExternalReference(reference: ExternalReference): void {
    const exists = this.props.externalReferences.some(
      (r) =>
        r.data.provider === reference.data.provider &&
        r.data.resourceType === reference.data.resourceType
    )

    if (exists) return

    this.props.externalReferences.push(reference)
    this.touch()
  }
}
