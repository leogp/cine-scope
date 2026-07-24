import { CreateMovieUseCase } from '../../src/application/use-cases/movie/create/createMovieUseCase'
import { CreateMovieRequest } from '../../src/application/use-cases/movie/create/createMovieRequest'
import { CompanyNotFoundError } from '../../src/domain/errors/companyNotFoundError'
import { GenreNotFoundError } from '../../src/domain/errors/genreNotFoundError'
import { PersonNotFoundError } from '../../src/domain/errors/personNotFoundError'
import { InvalidDurationError } from '../../src/domain/errors/invalidDurationError'
import { InvalidLanguageCodeError } from '../../src/domain/errors/invalidLanguageCodeError'
import { InvalidMovieTitleError } from '../../src/domain/errors/invalidMovieTitleError'
import { InMemoryCompanyRepository } from '../fakes/inMemoryCompanyRepository'
import { InMemoryGenreRepository } from '../fakes/inMemoryGenreRepository'
import { InMemoryMovieRepository } from '../fakes/inMemoryMovieRepository'
import { InMemoryPersonRepository } from '../fakes/inMemoryPersonRepository'
import { buildCompany, buildGenre, buildPerson } from '../helpers/builders'

const makeSut = () => {
  const movieRepository = new InMemoryMovieRepository()
  const genreRepository = new InMemoryGenreRepository()
  const personRepository = new InMemoryPersonRepository()
  const companyRepository = new InMemoryCompanyRepository()
  const useCase = new CreateMovieUseCase(
    movieRepository,
    genreRepository,
    personRepository,
    companyRepository
  )

  return { useCase, movieRepository, genreRepository, personRepository, companyRepository }
}

const validRequest = (overrides: Partial<CreateMovieRequest> = {}): CreateMovieRequest => ({
  title: 'Lady Bird',
  overview: null,
  releaseDate: null,
  duration: null,
  originalLanguage: 'en',
  posterPath: null,
  backdropPath: null,
  genreIds: [],
  castIds: [],
  directorIds: [],
  companyIds: [],
  ...overrides,
})

describe('CreateMovieUseCase', () => {
  it('creates a movie with no relations and returns its id', async () => {
    const { useCase, movieRepository } = makeSut()

    const response = await useCase.execute(validRequest())

    expect(response.id).toEqual(expect.any(String))

    const saved = await movieRepository.findById(response.id)
    expect(saved).not.toBeNull()
    expect(saved!.data.title.value).toBe('Lady Bird')
    expect(saved!.data.originalLanguage.value).toBe('en')
    expect(saved!.data.duration).toBeNull()
  })

  it('resolves and attaches the relation ids', async () => {
    const { useCase, movieRepository, genreRepository, personRepository, companyRepository } =
      makeSut()

    const genre = buildGenre()
    const actor = buildPerson()
    const director = buildPerson()
    const company = buildCompany()
    await genreRepository.save(genre)
    await personRepository.save(actor)
    await personRepository.save(director)
    await companyRepository.save(company)

    const response = await useCase.execute(
      validRequest({
        duration: 94,
        genreIds: [genre.id],
        castIds: [actor.id],
        directorIds: [director.id],
        companyIds: [company.id],
      })
    )

    const saved = await movieRepository.findById(response.id)
    expect(saved!.data.duration?.value).toBe(94)
    expect(saved!.data.genres.map((g) => g.id)).toEqual([genre.id])
    expect(saved!.data.cast.map((p) => p.id)).toEqual([actor.id])
    expect(saved!.data.directors.map((p) => p.id)).toEqual([director.id])
    expect(saved!.data.productionCompanies.map((c) => c.id)).toEqual([company.id])
  })

  it('rejects an invalid title and saves nothing', async () => {
    const { useCase, movieRepository } = makeSut()

    await expect(useCase.execute(validRequest({ title: '' }))).rejects.toThrow(
      InvalidMovieTitleError
    )
    expect(movieRepository.size).toBe(0)
  })

  it('rejects an invalid language code', async () => {
    const { useCase } = makeSut()

    await expect(useCase.execute(validRequest({ originalLanguage: 'eng' }))).rejects.toThrow(
      InvalidLanguageCodeError
    )
  })

  it('rejects an out-of-range duration', async () => {
    const { useCase } = makeSut()

    await expect(useCase.execute(validRequest({ duration: 0 }))).rejects.toThrow(
      InvalidDurationError
    )
  })

  it('throws GenreNotFoundError when a genre id is unknown', async () => {
    const { useCase, movieRepository } = makeSut()

    await expect(useCase.execute(validRequest({ genreIds: ['missing'] }))).rejects.toThrow(
      GenreNotFoundError
    )
    expect(movieRepository.size).toBe(0)
  })

  it('throws PersonNotFoundError when a cast id is unknown', async () => {
    const { useCase } = makeSut()

    await expect(useCase.execute(validRequest({ castIds: ['missing'] }))).rejects.toThrow(
      PersonNotFoundError
    )
  })

  it('throws CompanyNotFoundError when a company id is unknown', async () => {
    const { useCase } = makeSut()

    await expect(useCase.execute(validRequest({ companyIds: ['missing'] }))).rejects.toThrow(
      CompanyNotFoundError
    )
  })
})
