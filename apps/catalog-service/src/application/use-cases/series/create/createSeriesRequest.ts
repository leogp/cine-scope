export interface CreateSeriesRequest {
  title: string
  overview: string | null
  firstAirDate: Date | null
  lastAirDate: Date | null
  originalLanguage: string
  posterPath: string | null
  backdropPath: string | null
  genreIds: string[]
  castIds: string[]
  directorIds: string[]
  companyIds: string[]
}
