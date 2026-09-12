import { CreateGenreUseCase } from '@catalog/application/use-cases/genre/create/createGenreUseCase'
import { InvalidGenreNameError } from '@catalog/domain/errors/invalidGenreNameError'
import { InMemoryGenreRepository } from '../fakes/inMemoryGenreRepository'

const makeSut = () => {
  const genreRepository = new InMemoryGenreRepository()
  const useCase = new CreateGenreUseCase(genreRepository)

  return { useCase, genreRepository }
}

describe('CreateGenreUseCase', () => {
  it('creates a genre and persists it', async () => {
    const { useCase, genreRepository } = makeSut()

    const response = await useCase.execute({ name: 'Drama' })

    expect(response.id).toEqual(expect.any(String))

    const saved = await genreRepository.findById(response.id)
    expect(saved).not.toBeNull()
    expect(saved!.data.name.value).toBe('Drama')
  })

  it('rejects an invalid name and saves nothing', async () => {
    const { useCase, genreRepository } = makeSut()

    await expect(useCase.execute({ name: '' })).rejects.toThrow(InvalidGenreNameError)
    expect(genreRepository.size).toBe(0)
  })
})
