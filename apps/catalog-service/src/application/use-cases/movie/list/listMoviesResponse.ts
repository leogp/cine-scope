import { PaginatedResult } from '@cinescope/shared/application'
import { MovieSummaryDTO } from '../shared/movieMappers'

export type ListMoviesResponse = PaginatedResult<MovieSummaryDTO>
