import { Movie } from '@catalog/domain/entities/movie'
import {
  CompanyDTO,
  GenreDTO,
  PersonDTO,
  toCompanyDTO,
  toGenreDTO,
  toPersonDTO,
} from '@catalog/application/use-cases/shared/relationMappers'

export interface MovieDTO {
  id: string
  title: string
  overview: string | null
  releaseDate: Date | null
  duration: number | null
  originalLanguage: string
  posterPath: string | null
  backdropPath: string | null
  genres: GenreDTO[]
  cast: PersonDTO[]
  directors: PersonDTO[]
  productionCompanies: CompanyDTO[]
  createdAt: Date
  updatedAt: Date
}

// The list view omits the join-heavy relation arrays; full relations are
// available through the get use-case.
export type MovieSummaryDTO = Omit<
  MovieDTO,
  'genres' | 'cast' | 'directors' | 'productionCompanies'
>

/**
 * Unwraps a Movie aggregate (and its relations) into a flat primitive DTO.
 * This is the single place where value objects are unwrapped to primitives.
 */
export function toMovieDTO(movie: Movie): MovieDTO {
  const { genres, cast, directors, productionCompanies } = movie.data

  return {
    ...toMovieSummaryDTO(movie),
    genres: genres.map(toGenreDTO),
    cast: cast.map(toPersonDTO),
    directors: directors.map(toPersonDTO),
    productionCompanies: productionCompanies.map(toCompanyDTO),
  }
}

export function toMovieSummaryDTO(movie: Movie): MovieSummaryDTO {
  const {
    title,
    overview,
    releaseDate,
    duration,
    originalLanguage,
    posterPath,
    backdropPath,
    createdAt,
    updatedAt,
  } = movie.data

  return {
    id: movie.id,
    title: title.value,
    overview,
    releaseDate,
    duration: duration?.value ?? null,
    originalLanguage: originalLanguage.value,
    posterPath,
    backdropPath,
    createdAt,
    updatedAt,
  }
}
