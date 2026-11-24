import { ListSeriesUseCase } from '@catalog/application/use-cases/series/list/listSeriesUseCase'
import { InMemorySeriesRepository } from '../fakes/inMemorySeriesRepository'
import { buildGenre, buildSeries } from '../helpers/builders'

const makeSut = () => {
  const seriesRepository = new InMemorySeriesRepository()
  const useCase = new ListSeriesUseCase(seriesRepository)

  return { useCase, seriesRepository }
}

const seed = async (repo: InMemorySeriesRepository, count: number) => {
  for (let i = 0; i < count; i += 1) {
    await repo.save(buildSeries())
  }
}

describe('ListSeriesUseCase', () => {
  it('returns an empty page when there are no series', async () => {
    const { useCase } = makeSut()

    const response = await useCase.execute({})

    expect(response.items).toEqual([])
    expect(response.total).toBe(0)
    expect(response.totalPages).toBe(0)
    expect(response.page).toBe(1)
    expect(response.pageSize).toBe(20)
  })

  it('reports total and totalPages against the default page size', async () => {
    const { useCase, seriesRepository } = makeSut()
    await seed(seriesRepository, 25)

    const response = await useCase.execute({})

    expect(response.total).toBe(25)
    expect(response.totalPages).toBe(2)
    expect(response.items).toHaveLength(20)
  })

  it('windows results by page/offset', async () => {
    const { useCase, seriesRepository } = makeSut()
    await seed(seriesRepository, 25)

    const response = await useCase.execute({ page: 2, pageSize: 10 })

    expect(response.page).toBe(2)
    expect(response.items).toHaveLength(10)
  })

  it('clamps pageSize to the maximum', async () => {
    const { useCase } = makeSut()

    const response = await useCase.execute({ pageSize: 1000 })

    expect(response.pageSize).toBe(100)
  })

  it('renders summaries without the relation arrays', async () => {
    const { useCase, seriesRepository } = makeSut()
    await seriesRepository.save(buildSeries({ genres: [buildGenre()] }))

    const response = await useCase.execute({})

    expect(response.items[0]).toMatchObject({ title: 'Fleabag', originalLanguage: 'en' })
    expect(response.items[0]).not.toHaveProperty('genres')
  })
})
