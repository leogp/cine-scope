import { Series } from '@catalog/domain/entities/series'
import {
  CompanyDTO,
  GenreDTO,
  PersonDTO,
  toCompanyDTO,
  toGenreDTO,
  toPersonDTO,
} from '@catalog/application/use-cases/shared/relationMappers'

export interface SeriesDTO {
  id: string
  title: string
  overview: string | null
  firstAirDate: Date | null
  lastAirDate: Date | null
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
export type SeriesSummaryDTO = Omit<
  SeriesDTO,
  'genres' | 'cast' | 'directors' | 'productionCompanies'
>

/**
 * Unwraps a Series aggregate (and its relations) into a flat primitive DTO.
 * This is the single place where value objects are unwrapped to primitives.
 */
export function toSeriesDTO(series: Series): SeriesDTO {
  const { genres, cast, directors, productionCompanies } = series.data

  return {
    ...toSeriesSummaryDTO(series),
    genres: genres.map(toGenreDTO),
    cast: cast.map(toPersonDTO),
    directors: directors.map(toPersonDTO),
    productionCompanies: productionCompanies.map(toCompanyDTO),
  }
}

export function toSeriesSummaryDTO(series: Series): SeriesSummaryDTO {
  const {
    title,
    overview,
    firstAirDate,
    lastAirDate,
    originalLanguage,
    posterPath,
    backdropPath,
    createdAt,
    updatedAt,
  } = series.data

  return {
    id: series.id,
    title: title.value,
    overview,
    firstAirDate,
    lastAirDate,
    originalLanguage: originalLanguage.value,
    posterPath,
    backdropPath,
    createdAt,
    updatedAt,
  }
}
