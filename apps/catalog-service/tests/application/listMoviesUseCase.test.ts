import { ListMoviesUseCase } from '../../src/application/use-cases/movie/list/listMoviesUseCase'
import { InMemoryMovieRepository } from '../fakes/inMemoryMovieRepository'
import { buildMovie } from '../helpers/builders'

const makeSut = () => {
  const movieRepository = new InMemoryMovieRepository()
  const useCase = new ListMoviesUseCase(movieRepository)

  return { useCase, movieRepository }
}

const seed = async (repo: InMemoryMovieRepository, count: number) => {
  for (let i = 0; i < count; i += 1) {
    await repo.save(buildMovie())
  }
}

describe('ListMoviesUseCase', () => {
  it('returns an empty page when there are no movies', async () => {
    const { useCase } = makeSut()

    const response = await useCase.execute({})

    expect(response.items).toEqual([])
    expect(response.total).toBe(0)
    expect(response.totalPages).toBe(0)
    expect(response.page).toBe(1)
    expect(response.pageSize).toBe(20)
  })

  it('reports total and totalPages against the default page size', async () => {
    const { useCase, movieRepository } = makeSut()
    await seed(movieRepository, 25)

    const response = await useCase.execute({})

    expect(response.total).toBe(25)
    expect(response.totalPages).toBe(2)
    expect(response.items).toHaveLength(20)
  })

  it('windows results by page/offset', async () => {
    const { useCase, movieRepository } = makeSut()
    await seed(movieRepository, 25)

    const response = await useCase.execute({ page: 2, pageSize: 10 })

    expect(response.page).toBe(2)
    expect(response.items).toHaveLength(10)
  })

  it('clamps pageSize to the maximum', async () => {
    const { useCase } = makeSut()

    const response = await useCase.execute({ pageSize: 1000 })

    expect(response.pageSize).toBe(100)
  })
})
