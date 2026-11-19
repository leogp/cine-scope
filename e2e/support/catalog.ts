/**
 * A valid body for POST and PUT /catalog/movies: catalog's createMovieSchema,
 * which PUT shares (full replace). Language is ISO 639-1, duration whole minutes.
 */
export function movieBody(title: string): Record<string, unknown> {
  return {
    title,
    overview: 'Created by the end-to-end suite',
    releaseDate: '2026-01-01',
    duration: 120,
    originalLanguage: 'en',
    posterPath: null,
    backdropPath: null,
    genreIds: [],
    castIds: [],
    directorIds: [],
    companyIds: [],
  }
}
