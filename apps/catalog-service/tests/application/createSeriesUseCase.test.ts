import { CreateSeriesRequest } from '@catalog/application/use-cases/series/create/createSeriesRequest'
import { CreateSeriesUseCase } from '@catalog/application/use-cases/series/create/createSeriesUseCase'
import { CompanyNotFoundError } from '@catalog/domain/errors/companyNotFoundError'
import { GenreNotFoundError } from '@catalog/domain/errors/genreNotFoundError'
import { InvalidLanguageCodeError } from '@catalog/domain/errors/invalidLanguageCodeError'
import { InvalidMovieTitleError } from '@catalog/domain/errors/invalidMovieTitleError'
import { PersonNotFoundError } from '@catalog/domain/errors/personNotFoundError'
import { InMemoryCompanyRepository } from '../fakes/inMemoryCompanyRepository'
import { InMemoryGenreRepository } from '../fakes/inMemoryGenreRepository'
import { InMemoryPersonRepository } from '../fakes/inMemoryPersonRepository'
import { InMemorySeriesRepository } from '../fakes/inMemorySeriesRepository'
import { buildCompany, buildGenre, buildPerson } from '../helpers/builders'

const makeSut = () => {
  const seriesRepository = new InMemorySeriesRepository()
  const genreRepository = new InMemoryGenreRepository()
  const personRepository = new InMemoryPersonRepository()
  const companyRepository = new InMemoryCompanyRepository()
  const useCase = new CreateSeriesUseCase(
    seriesRepository,
    genreRepository,
    personRepository,
    companyRepository
  )

  return { useCase, seriesRepository, genreRepository, personRepository, companyRepository }
}

const validRequest = (overrides: Partial<CreateSeriesRequest> = {}): CreateSeriesRequest => ({
  title: 'Fleabag',
  overview: null,
  firstAirDate: null,
  lastAirDate: null,
  originalLanguage: 'en',
  posterPath: null,
  backdropPath: null,
  genreIds: [],
  castIds: [],
  directorIds: [],
  companyIds: [],
  ...overrides,
})

describe('CreateSeriesUseCase', () => {
  it('creates a series resolving every relation id to its entity', async () => {
    const { useCase, seriesRepository, genreRepository, personRepository, companyRepository } =
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
        genreIds: [genre.id],
        castIds: [actor.id],
        directorIds: [director.id],
        companyIds: [company.id],
      })
    )

    expect(response.id).toEqual(expect.any(String))

    const saved = await seriesRepository.findById(response.id)
    expect(saved).not.toBeNull()
    expect(saved!.data.title.value).toBe('Fleabag')
    expect(saved!.data.originalLanguage.value).toBe('en')
    expect(saved!.data.genres.map((g) => g.id)).toEqual([genre.id])
    expect(saved!.data.cast.map((p) => p.id)).toEqual([actor.id])
    expect(saved!.data.directors.map((p) => p.id)).toEqual([director.id])
    expect(saved!.data.productionCompanies.map((c) => c.id)).toEqual([company.id])
  })

  it('rejects when a genre id does not exist and saves nothing', async () => {
    const { useCase, seriesRepository } = makeSut()

    await expect(useCase.execute(validRequest({ genreIds: ['missing'] }))).rejects.toThrow(
      GenreNotFoundError
    )
    expect(seriesRepository.size).toBe(0)
  })

  it('rejects when a cast or director id does not exist', async () => {
    const { useCase } = makeSut()

    await expect(useCase.execute(validRequest({ castIds: ['missing'] }))).rejects.toThrow(
      PersonNotFoundError
    )
    await expect(useCase.execute(validRequest({ directorIds: ['missing'] }))).rejects.toThrow(
      PersonNotFoundError
    )
  })

  it('rejects when a company id does not exist', async () => {
    const { useCase } = makeSut()

    await expect(useCase.execute(validRequest({ companyIds: ['missing'] }))).rejects.toThrow(
      CompanyNotFoundError
    )
  })

  it('rejects an invalid title and saves nothing', async () => {
    const { useCase, seriesRepository } = makeSut()

    await expect(useCase.execute(validRequest({ title: '' }))).rejects.toThrow(
      InvalidMovieTitleError
    )
    expect(seriesRepository.size).toBe(0)
  })

  it('rejects an invalid language code and saves nothing', async () => {
    const { useCase, seriesRepository } = makeSut()

    await expect(useCase.execute(validRequest({ originalLanguage: 'english' }))).rejects.toThrow(
      InvalidLanguageCodeError
    )
    expect(seriesRepository.size).toBe(0)
  })
})
