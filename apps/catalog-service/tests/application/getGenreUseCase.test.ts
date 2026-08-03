import { GetGenreUseCase } from '@catalog/application/use-cases/genre/get/getGenreUseCase'
import { GenreNotFoundError } from '@catalog/domain/errors/genreNotFoundError'
import { InMemoryGenreRepository } from '../fakes/inMemoryGenreRepository'
import { buildGenre } from '../helpers/builders'

const makeSut = () => {
  const genreRepository = new InMemoryGenreRepository()
  const useCase = new GetGenreUseCase(genreRepository)

  return { useCase, genreRepository }
}

describe('GetGenreUseCase', () => {
  it('returns the genre with value objects unwrapped to primitives', async () => {
    const { useCase, genreRepository } = makeSut()
    const genre = buildGenre()
    await genreRepository.save(genre)

    const response = await useCase.execute({ id: genre.id })

    expect(response).toEqual({
      id: genre.id,
      name: 'Drama',
      createdAt: genre.data.createdAt,
      updatedAt: genre.data.updatedAt,
    })
  })

  it('rejects when the genre does not exist', async () => {
    const { useCase } = makeSut()

    await expect(useCase.execute({ id: 'missing-id' })).rejects.toThrow(GenreNotFoundError)
  })
})
