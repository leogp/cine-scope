import { DeleteSeriesUseCase } from '@catalog/application/use-cases/series/delete/deleteSeriesUseCase'
import { SeriesNotFoundError } from '@catalog/domain/errors/seriesNotFoundError'
import { InMemorySeriesRepository } from '../fakes/inMemorySeriesRepository'
import { buildSeries } from '../helpers/builders'

const makeSut = () => {
  const seriesRepository = new InMemorySeriesRepository()
  const useCase = new DeleteSeriesUseCase(seriesRepository)

  return { useCase, seriesRepository }
}

describe('DeleteSeriesUseCase', () => {
  it('deletes an existing series', async () => {
    const { useCase, seriesRepository } = makeSut()

    const series = buildSeries()
    await seriesRepository.save(series)

    await useCase.execute({ id: series.id })

    expect(await seriesRepository.exists(series.id)).toBe(false)
    expect(await seriesRepository.findById(series.id)).toBeNull()
  })

  it('throws SeriesNotFoundError when the series is absent', async () => {
    const { useCase, seriesRepository } = makeSut()

    await expect(useCase.execute({ id: 'missing' })).rejects.toThrow(SeriesNotFoundError)
    expect(seriesRepository.size).toBe(0)
  })
})
