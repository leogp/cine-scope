import { GetSeriesUseCase } from '../../src/application/use-cases/series/get/getSeriesUseCase'
import { SeriesNotFoundError } from '../../src/domain/errors/seriesNotFoundError'
import { InMemorySeriesRepository } from '../fakes/inMemorySeriesRepository'
import { buildCompany, buildGenre, buildPerson, buildSeries } from '../helpers/builders'

const makeSut = () => {
  const seriesRepository = new InMemorySeriesRepository()
  const useCase = new GetSeriesUseCase(seriesRepository)

  return { useCase, seriesRepository }
}

describe('GetSeriesUseCase', () => {
  it('returns a flattened DTO with value objects unwrapped and relations mapped', async () => {
    const { useCase, seriesRepository } = makeSut()

    const genre = buildGenre()
    const actor = buildPerson()
    const company = buildCompany()
    const series = buildSeries({
      genres: [genre],
      cast: [actor],
      productionCompanies: [company],
    })
    await seriesRepository.save(series)

    const response = await useCase.execute({ id: series.id })

    expect(response).toMatchObject({
      id: series.id,
      title: 'Fleabag',
      originalLanguage: 'en',
    })
    expect(response.genres).toEqual([{ id: genre.id, name: genre.data.name.value }])
    expect(response.cast[0]).toMatchObject({ id: actor.id, name: actor.data.name.value })
    expect(response.productionCompanies[0]).toMatchObject({ id: company.id })
  })

  it('maps null optionals to null', async () => {
    const { useCase, seriesRepository } = makeSut()

    const series = buildSeries()
    await seriesRepository.save(series)

    const response = await useCase.execute({ id: series.id })

    expect(response.overview).toBeNull()
    expect(response.firstAirDate).toBeNull()
    expect(response.lastAirDate).toBeNull()
    expect(response.genres).toEqual([])
  })

  it('throws SeriesNotFoundError when the series is absent', async () => {
    const { useCase } = makeSut()

    await expect(useCase.execute({ id: 'missing' })).rejects.toThrow(SeriesNotFoundError)
  })
})
