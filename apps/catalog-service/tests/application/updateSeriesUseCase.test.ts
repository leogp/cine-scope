import { UpdateSeriesRequest } from '@catalog/application/use-cases/series/update/updateSeriesRequest'
import { UpdateSeriesUseCase } from '@catalog/application/use-cases/series/update/updateSeriesUseCase'
import { Series } from '@catalog/domain/entities/series'
import { GenreNotFoundError } from '@catalog/domain/errors/genreNotFoundError'
import { InvalidTitleError } from '@catalog/domain/errors/invalidTitleError'
import { SeriesNotFoundError } from '@catalog/domain/errors/seriesNotFoundError'
import { InMemoryCompanyRepository } from '../fakes/inMemoryCompanyRepository'
import { InMemoryGenreRepository } from '../fakes/inMemoryGenreRepository'
import { InMemoryPersonRepository } from '../fakes/inMemoryPersonRepository'
import { InMemorySeriesRepository } from '../fakes/inMemorySeriesRepository'
import { buildGenre, buildSeries } from '../helpers/builders'

const makeSut = () => {
  const seriesRepository = new InMemorySeriesRepository()
  const genreRepository = new InMemoryGenreRepository()
  const personRepository = new InMemoryPersonRepository()
  const companyRepository = new InMemoryCompanyRepository()
  const useCase = new UpdateSeriesUseCase(
    seriesRepository,
    genreRepository,
    personRepository,
    companyRepository
  )

  return { useCase, seriesRepository, genreRepository, personRepository, companyRepository }
}

const updateRequest = (overrides: Partial<UpdateSeriesRequest> = {}): UpdateSeriesRequest => ({
  id: 'series-id',
  title: 'Succession',
  overview: 'A media dynasty fights over its future',
  firstAirDate: new Date('2018-06-03T00:00:00.000Z'),
  lastAirDate: new Date('2023-05-28T00:00:00.000Z'),
  originalLanguage: 'en',
  posterPath: null,
  backdropPath: null,
  genreIds: [],
  castIds: [],
  directorIds: [],
  companyIds: [],
  ...overrides,
})

describe('UpdateSeriesUseCase', () => {
  it('full-replaces scalar fields and relation arrays', async () => {
    const { useCase, seriesRepository, genreRepository } = makeSut()

    const genre = buildGenre()
    await genreRepository.save(genre)

    const existing = buildSeries()
    await seriesRepository.save(existing)

    await useCase.execute(updateRequest({ id: existing.id, genreIds: [genre.id] }))

    const saved = await seriesRepository.findById(existing.id)
    expect(saved!.data.title.value).toBe('Succession')
    expect(saved!.data.overview).toBe('A media dynasty fights over its future')
    expect(saved!.data.firstAirDate).toEqual(new Date('2018-06-03T00:00:00.000Z'))
    expect(saved!.data.lastAirDate).toEqual(new Date('2023-05-28T00:00:00.000Z'))
    expect(saved!.data.genres.map((g) => g.id)).toEqual([genre.id])
  })

  it('clears the relations the request leaves out', async () => {
    const { useCase, seriesRepository } = makeSut()

    const existing = buildSeries({ genres: [buildGenre()] })
    await seriesRepository.save(existing)

    await useCase.execute(updateRequest({ id: existing.id }))

    const saved = await seriesRepository.findById(existing.id)
    expect(saved!.data.genres).toEqual([])
  })

  // Restored with past timestamps: a series created in the same millisecond as
  // the update would leave updatedAt unchanged and the assertion vacuous.
  it('advances updatedAt and keeps createdAt', async () => {
    const { useCase, seriesRepository } = makeSut()

    const past = new Date('2020-01-01T00:00:00.000Z')
    const existing = Series.restore({ ...buildSeries().data, createdAt: past, updatedAt: past })
    await seriesRepository.save(existing)

    await useCase.execute(updateRequest({ id: existing.id }))

    const saved = await seriesRepository.findById(existing.id)
    expect(saved!.data.updatedAt.getTime()).toBeGreaterThan(past.getTime())
    expect(saved!.data.createdAt).toEqual(past)
  })

  it('throws SeriesNotFoundError when the target is absent', async () => {
    const { useCase } = makeSut()

    await expect(useCase.execute(updateRequest({ id: 'missing' }))).rejects.toThrow(
      SeriesNotFoundError
    )
  })

  it('throws a relation NotFound when a related id is missing', async () => {
    const { useCase, seriesRepository } = makeSut()

    const existing = buildSeries()
    await seriesRepository.save(existing)

    await expect(
      useCase.execute(updateRequest({ id: existing.id, genreIds: ['missing'] }))
    ).rejects.toThrow(GenreNotFoundError)
  })

  it('rejects an invalid title', async () => {
    const { useCase, seriesRepository } = makeSut()

    const existing = buildSeries()
    await seriesRepository.save(existing)

    await expect(useCase.execute(updateRequest({ id: existing.id, title: '' }))).rejects.toThrow(
      InvalidTitleError
    )
  })
})
