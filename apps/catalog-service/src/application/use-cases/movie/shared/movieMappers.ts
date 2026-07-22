import { Movie } from '../../../../domain/entities/movie'

export interface GenreDTO {
  id: string
  name: string
}

export interface PersonDTO {
  id: string
  name: string
  biography: string | null
  birthDate: Date | null
  profilePath: string | null
}

export interface CompanyDTO {
  id: string
  name: string
  logoPath: string | null
  countryCode: string | null
}

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

const toPersonDTO = (person: Movie['data']['cast'][number]): PersonDTO => {
  const { name, biography, birthDate, profilePath } = person.data

  return {
    id: person.id,
    name: name.value,
    biography,
    birthDate,
    profilePath,
  }
}

/**
 * Unwraps a Movie aggregate (and its relations) into a flat primitive DTO.
 * This is the single place where value objects are unwrapped to primitives.
 */
export function toMovieDTO(movie: Movie): MovieDTO {
  const {
    title,
    overview,
    releaseDate,
    duration,
    originalLanguage,
    posterPath,
    backdropPath,
    genres,
    cast,
    directors,
    productionCompanies,
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
    genres: genres.map((genre) => ({ id: genre.id, name: genre.data.name.value })),
    cast: cast.map(toPersonDTO),
    directors: directors.map(toPersonDTO),
    productionCompanies: productionCompanies.map((company) => ({
      id: company.id,
      name: company.data.name.value,
      logoPath: company.data.logoPath,
      countryCode: company.data.countryCode?.value ?? null,
    })),
    createdAt,
    updatedAt,
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
