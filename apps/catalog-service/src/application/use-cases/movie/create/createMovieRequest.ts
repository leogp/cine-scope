export interface CreateMovieRequest {
  title: string
  overview: string | null
  releaseDate: Date | null
  duration: number | null
  originalLanguage: string
  posterPath: string | null
  backdropPath: string | null
  genreIds: string[]
  castIds: string[]
  directorIds: string[]
  companyIds: string[]
}
