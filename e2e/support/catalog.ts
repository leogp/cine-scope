export interface Relations {
  readonly genreIds: readonly string[]
  readonly castIds: readonly string[]
  readonly directorIds: readonly string[]
  readonly companyIds: readonly string[]
}

const NO_RELATIONS: Relations = { genreIds: [], castIds: [], directorIds: [], companyIds: [] }

/**
 * A valid body for POST and PUT /catalog/movies: catalog's createMovieSchema,
 * which PUT shares (full replace). Language is ISO 639-1, duration whole minutes.
 */
export function movieBody(
  title: string,
  relations: Relations = NO_RELATIONS
): Record<string, unknown> {
  return {
    title,
    overview: 'Created by the end-to-end suite',
    releaseDate: '2026-01-01',
    duration: 120,
    originalLanguage: 'en',
    posterPath: null,
    backdropPath: null,
    ...relations,
  }
}

/** A valid body for POST /catalog/series: catalog's createSeriesSchema. */
export function seriesBody(
  title: string,
  relations: Relations = NO_RELATIONS
): Record<string, unknown> {
  return {
    title,
    overview: 'Created by the end-to-end suite',
    firstAirDate: '2025-01-01',
    lastAirDate: null,
    originalLanguage: 'en',
    posterPath: null,
    backdropPath: null,
    ...relations,
  }
}
