import { UseCase, buildPaginatedResult, normalizePagination } from '@cinescope/shared/application'
import { SeriesRepository } from '@catalog/domain/repositories/seriesRepository'
import { toSeriesSummaryDTO } from '../shared/seriesMappers'
import { ListSeriesRequest } from './listSeriesRequest'
import { ListSeriesResponse } from './listSeriesResponse'

export class ListSeriesUseCase implements UseCase<ListSeriesRequest, ListSeriesResponse> {
  constructor(private readonly seriesRepository: SeriesRepository) {}

  async execute(request: ListSeriesRequest): Promise<ListSeriesResponse> {
    const params = normalizePagination(request)
    const offset = (params.page - 1) * params.pageSize

    const { items, total } = await this.seriesRepository.findAll({
      limit: params.pageSize,
      offset,
    })

    return buildPaginatedResult(items.map(toSeriesSummaryDTO), total, params)
  }
}
