import { DeleteMovieUseCase } from '@catalog/application/use-cases/movie/delete/deleteMovieUseCase'
import { MovieNotFoundError } from '@catalog/domain/errors/movieNotFoundError'
import { InMemoryMovieRepository } from '../fakes/inMemoryMovieRepository'
import { buildMovie } from '../helpers/builders'

const makeSut = () => {
  const movieRepository = new InMemoryMovieRepository()
  const useCase = new DeleteMovieUseCase(movieRepository)

  return { useCase, movieRepository }
}

describe('DeleteMovieUseCase', () => {
  it('deletes an existing movie', async () => {
    const { useCase, movieRepository } = makeSut()

    const movie = buildMovie()
    await movieRepository.save(movie)

    await useCase.execute({ id: movie.id })

    expect(await movieRepository.exists(movie.id)).toBe(false)
    expect(await movieRepository.findById(movie.id)).toBeNull()
  })

  it('throws MovieNotFoundError when the movie is absent', async () => {
    const { useCase, movieRepository } = makeSut()

    await expect(useCase.execute({ id: 'missing' })).rejects.toThrow(MovieNotFoundError)
    expect(movieRepository.size).toBe(0)
  })
})
