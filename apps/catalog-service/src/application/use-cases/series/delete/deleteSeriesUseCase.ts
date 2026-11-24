import { UseCase } from '@cinescope/shared/application'
import { SeriesNotFoundError } from '@catalog/domain/errors/seriesNotFoundError'
import { SeriesRepository } from '@catalog/domain/repositories/seriesRepository'
import { DeleteSeriesRequest } from './deleteSeriesRequest'
import { DeleteSeriesResponse } from './deleteSeriesResponse'

export class DeleteSeriesUseCase implements UseCase<DeleteSeriesRequest, DeleteSeriesResponse> {
  constructor(private readonly seriesRepository: SeriesRepository) {}

  async execute(request: DeleteSeriesRequest): Promise<DeleteSeriesResponse> {
    const exists = await this.seriesRepository.exists(request.id)

    if (!exists) {
      throw new SeriesNotFoundError()
    }

    await this.seriesRepository.delete(request.id)
  }
}
