import { GetMovieUseCase } from '../../src/application/use-cases/movie/get/getMovieUseCase'
import { MovieNotFoundError } from '../../src/domain/errors/movieNotFoundError'
import { Duration } from '../../src/domain/value-objects/duration'
import { InMemoryMovieRepository } from '../fakes/inMemoryMovieRepository'
import { buildCompany, buildGenre, buildMovie, buildPerson } from '../helpers/builders'

const makeSut = () => {
  const movieRepository = new InMemoryMovieRepository()
  const useCase = new GetMovieUseCase(movieRepository)

  return { useCase, movieRepository }
}

describe('GetMovieUseCase', () => {
  it('returns a flattened DTO with value objects unwrapped and relations mapped', async () => {
    const { useCase, movieRepository } = makeSut()

    const genre = buildGenre()
    const actor = buildPerson()
    const company = buildCompany()
    const movie = buildMovie({
      duration: Duration.create(94),
      genres: [genre],
      cast: [actor],
      productionCompanies: [company],
    })
    await movieRepository.save(movie)

    const response = await useCase.execute({ id: movie.id })

    expect(response).toMatchObject({
      id: movie.id,
      title: 'Lady Bird',
      originalLanguage: 'en',
      duration: 94,
    })
    expect(response.genres).toEqual([{ id: genre.id, name: genre.data.name.value }])
    expect(response.cast[0]).toMatchObject({ id: actor.id, name: actor.data.name.value })
    expect(response.productionCompanies[0]).toMatchObject({ id: company.id })
  })

  it('maps null optionals to null', async () => {
    const { useCase, movieRepository } = makeSut()

    const movie = buildMovie()
    await movieRepository.save(movie)

    const response = await useCase.execute({ id: movie.id })

    expect(response.duration).toBeNull()
    expect(response.overview).toBeNull()
    expect(response.releaseDate).toBeNull()
    expect(response.genres).toEqual([])
  })

  it('throws MovieNotFoundError when the movie is absent', async () => {
    const { useCase } = makeSut()

    await expect(useCase.execute({ id: 'missing' })).rejects.toThrow(MovieNotFoundError)
  })
})
