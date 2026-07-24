import { UseCase } from '@cinescope/shared/application'
import { SeriesRepository } from '../../../../domain/repositories/seriesRepository'
import { toSeriesDTO } from '../shared/seriesMappers'
import { GetSeriesRequest } from './getSeriesRequest'
import { GetSeriesResponse } from './getSeriesResponse'
import { SeriesNotFoundError } from '../../../../domain/errors/seriesNotFoundError'

export class GetSeriesUseCase implements UseCase<GetSeriesRequest, GetSeriesResponse> {
  constructor(private readonly seriesRepository: SeriesRepository) {}

  async execute(request: GetSeriesRequest): Promise<GetSeriesResponse> {
    const series = await this.seriesRepository.findById(request.id)

    if (!series) {
      throw new SeriesNotFoundError()
    }
    return toSeriesDTO(series)
  }
}
