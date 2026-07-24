import { UseCase, buildPaginatedResult, normalizePagination } from '@cinescope/shared/application'
import { MovieRepository } from '../../../../domain/repositories/movieRepository'
import { toMovieSummaryDTO } from '../shared/movieMappers'
import { ListMoviesRequest } from './listMoviesRequest'
import { ListMoviesResponse } from './listMoviesResponse'

export class ListMoviesUseCase implements UseCase<ListMoviesRequest, ListMoviesResponse> {
  constructor(private readonly movieRepository: MovieRepository) {}

  async execute(request: ListMoviesRequest): Promise<ListMoviesResponse> {
    const params = normalizePagination(request)
    const offset = (params.page - 1) * params.pageSize

    const { items, total } = await this.movieRepository.findAll({
      limit: params.pageSize,
      offset,
    })

    return buildPaginatedResult(items.map(toMovieSummaryDTO), total, params)
  }
}
