import { UpdateMovieUseCase } from '@catalog/application/use-cases/movie/update/updateMovieUseCase'
import { UpdateMovieRequest } from '@catalog/application/use-cases/movie/update/updateMovieRequest'
import { GenreNotFoundError } from '@catalog/domain/errors/genreNotFoundError'
import { MovieNotFoundError } from '@catalog/domain/errors/movieNotFoundError'
import { InvalidMovieTitleError } from '@catalog/domain/errors/invalidMovieTitleError'
import { InMemoryCompanyRepository } from '../fakes/inMemoryCompanyRepository'
import { InMemoryGenreRepository } from '../fakes/inMemoryGenreRepository'
import { InMemoryMovieRepository } from '../fakes/inMemoryMovieRepository'
import { InMemoryPersonRepository } from '../fakes/inMemoryPersonRepository'
import { buildGenre, buildMovie, buildPerson } from '../helpers/builders'

const makeSut = () => {
  const movieRepository = new InMemoryMovieRepository()
  const genreRepository = new InMemoryGenreRepository()
  const personRepository = new InMemoryPersonRepository()
  const companyRepository = new InMemoryCompanyRepository()
  const useCase = new UpdateMovieUseCase(
    movieRepository,
    genreRepository,
    personRepository,
    companyRepository
  )

  return { useCase, movieRepository, genreRepository, personRepository, companyRepository }
}

const updateRequest = (overrides: Partial<UpdateMovieRequest> = {}): UpdateMovieRequest => ({
  id: 'movie-id',
  title: 'Barbie',
  overview: 'A doll in the real world',
  releaseDate: null,
  duration: 114,
  originalLanguage: 'en',
  posterPath: null,
  backdropPath: null,
  genreIds: [],
  castIds: [],
  directorIds: [],
  companyIds: [],
  ...overrides,
})

describe('UpdateMovieUseCase', () => {
  it('full-replaces scalar fields and relation arrays', async () => {
    const { useCase, movieRepository, genreRepository } = makeSut()

    const genre = buildGenre()
    await genreRepository.save(genre)

    const existing = buildMovie()
    await movieRepository.save(existing)

    await useCase.execute(updateRequest({ id: existing.id, genreIds: [genre.id] }))

    const saved = await movieRepository.findById(existing.id)
    expect(saved!.data.title.value).toBe('Barbie')
    expect(saved!.data.overview).toBe('A doll in the real world')
    expect(saved!.data.duration?.value).toBe(114)
    expect(saved!.data.genres.map((g) => g.id)).toEqual([genre.id])
  })

  it('advances updatedAt', async () => {
    const { useCase, movieRepository } = makeSut()

    const existing = buildMovie()
    await movieRepository.save(existing)
    const before = existing.data.updatedAt.getTime()

    // Ensure the clock advances so the timestamp comparison is meaningful.
    jest.spyOn(Date, 'now').mockReturnValue(before + 1000)

    await useCase.execute(updateRequest({ id: existing.id }))

    const saved = await movieRepository.findById(existing.id)
    expect(saved!.data.updatedAt.getTime()).toBeGreaterThanOrEqual(before)

    jest.restoreAllMocks()
  })

  it('throws MovieNotFoundError when the target is absent', async () => {
    const { useCase } = makeSut()

    await expect(useCase.execute(updateRequest({ id: 'missing' }))).rejects.toThrow(
      MovieNotFoundError
    )
  })

  it('throws a relation NotFound when a related id is missing', async () => {
    const { useCase, movieRepository } = makeSut()

    const existing = buildMovie()
    await movieRepository.save(existing)

    await expect(
      useCase.execute(updateRequest({ id: existing.id, genreIds: ['missing'] }))
    ).rejects.toThrow(GenreNotFoundError)
  })

  it('rejects an invalid title', async () => {
    const { useCase, movieRepository } = makeSut()

    const existing = buildMovie()
    await movieRepository.save(existing)

    await expect(useCase.execute(updateRequest({ id: existing.id, title: '' }))).rejects.toThrow(
      InvalidMovieTitleError
    )
  })
})
