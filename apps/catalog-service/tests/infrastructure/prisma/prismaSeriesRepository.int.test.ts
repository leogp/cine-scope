import { randomUUID } from 'node:crypto'

import { Series } from '@catalog/domain/entities/series'
import { GenreName } from '@catalog/domain/value-objects/genreName'
import { LanguageCode } from '@catalog/domain/value-objects/languageCode'
import { Title } from '@catalog/domain/value-objects/title'
import { PrismaCompanyRepository } from '@catalog/infrastructure/prisma/company'
import { PrismaGenreRepository } from '@catalog/infrastructure/prisma/genre'
import { PrismaPersonRepository } from '@catalog/infrastructure/prisma/person'
import { PrismaSeriesRepository } from '@catalog/infrastructure/prisma/series'
import { buildCompany, buildGenre, buildPerson, buildSeries } from '../../helpers/builders'
import { createTestPrisma, truncateAll } from '../../helpers/testDb'

const prisma = createTestPrisma()
const seriesRepository = new PrismaSeriesRepository(prisma)
const genreRepository = new PrismaGenreRepository(prisma)
const personRepository = new PrismaPersonRepository(prisma)
const companyRepository = new PrismaCompanyRepository(prisma)

/**
 * `Series.create` mints `createdAt` from the clock, so three series saved in a
 * row can share a millisecond and leave findAll's `[createdAt, id]` sort to be
 * decided by a random uuid. Restoring with explicit timestamps makes the
 * pagination assertions deterministic.
 */
const restoreSeries = (title: string, createdAt: Date): Series =>
  Series.restore({
    id: randomUUID(),
    title: new Title(title),
    overview: null,
    firstAirDate: null,
    lastAirDate: null,
    originalLanguage: new LanguageCode('en'),
    posterPath: null,
    backdropPath: null,
    genres: [],
    cast: [],
    directors: [],
    productionCompanies: [],
    createdAt,
    updatedAt: createdAt,
  })

const orderedSeries = (): Series[] => [
  restoreSeries('First', new Date('2026-01-01T00:00:00.000Z')),
  restoreSeries('Second', new Date('2026-01-02T00:00:00.000Z')),
  restoreSeries('Third', new Date('2026-01-03T00:00:00.000Z')),
]

beforeEach(async () => {
  await truncateAll(prisma)
})

afterAll(async () => {
  await prisma.$disconnect()
})

describe('PrismaSeriesRepository', () => {
  it('saves a relation-less series and rehydrates its scalars', async () => {
    const series = buildSeries({ overview: 'A woman navigating grief in London.' })

    await seriesRepository.save(series)
    const found = await seriesRepository.findById(series.id)

    expect(found).not.toBeNull()
    expect(found!.id).toBe(series.id)
    expect(found!.data.title.value).toBe('Fleabag')
    expect(found!.data.overview).toBe('A woman navigating grief in London.')
    expect(found!.data.originalLanguage.value).toBe('en')
  })

  it('round-trips both air dates as calendar days', async () => {
    const series = buildSeries({
      firstAirDate: new Date('2016-07-21T00:00:00.000Z'),
      lastAirDate: new Date('2019-04-08T00:00:00.000Z'),
    })

    await seriesRepository.save(series)
    const found = await seriesRepository.findById(series.id)

    expect(found!.data.firstAirDate).toEqual(new Date('2016-07-21T00:00:00.000Z'))
    expect(found!.data.lastAirDate).toEqual(new Date('2019-04-08T00:00:00.000Z'))
  })

  it('rehydrates the aggregate timestamps rather than the column defaults', async () => {
    const series = buildSeries()

    await seriesRepository.save(series)
    const found = await seriesRepository.findById(series.id)

    expect(found!.data.createdAt).toEqual(series.data.createdAt)
    expect(found!.data.updatedAt).toEqual(series.data.updatedAt)
  })

  it('writes all four join tables and rehydrates them', async () => {
    const genre = buildGenre()
    const actor = buildPerson()
    const director = buildPerson()
    const company = buildCompany()
    await genreRepository.save(genre)
    await personRepository.save(actor)
    await personRepository.save(director)
    await companyRepository.save(company)

    const series = buildSeries({
      genres: [genre],
      cast: [actor],
      directors: [director],
      productionCompanies: [company],
    })
    await seriesRepository.save(series)

    const found = await seriesRepository.findById(series.id)

    expect(found!.data.genres.map((g) => g.id)).toEqual([genre.id])
    expect(found!.data.cast.map((p) => p.id)).toEqual([actor.id])
    expect(found!.data.directors.map((p) => p.id)).toEqual([director.id])
    expect(found!.data.productionCompanies.map((c) => c.id)).toEqual([company.id])
  })

  // set* are full replacements, so the update path must clear the old join
  // rows rather than accumulate them.
  it('replaces the join sets on a second save', async () => {
    // Distinct names: genres.name carries a unique index.
    const first = buildGenre({ name: new GenreName('Drama') })
    const second = buildGenre({ name: new GenreName('Comedy') })
    await genreRepository.save(first)
    await genreRepository.save(second)

    const series = buildSeries({ genres: [first] })
    await seriesRepository.save(series)

    series.setGenres([second])
    await seriesRepository.save(series)

    const found = await seriesRepository.findById(series.id)
    expect(found!.data.genres.map((g) => g.id)).toEqual([second.id])
    expect(await prisma.seriesGenre.count()).toBe(1)
  })

  it('dedupes repeated relation ids so the composite key holds', async () => {
    const genre = buildGenre()
    await genreRepository.save(genre)

    const series = buildSeries({ genres: [genre, genre] })

    await expect(seriesRepository.save(series)).resolves.toBeUndefined()
    expect(await prisma.seriesGenre.count()).toBe(1)
  })

  it('overwrites scalars on a second save without duplicating the row', async () => {
    const series = buildSeries()
    await seriesRepository.save(series)

    series.changeTitle(new Title('Killing Eve'))
    await seriesRepository.save(series)

    const found = await seriesRepository.findById(series.id)
    expect(found!.data.title.value).toBe('Killing Eve')
    expect(await prisma.series.count()).toBe(1)
  })

  it('returns null for an unknown id', async () => {
    expect(await seriesRepository.findById('missing')).toBeNull()
  })

  describe('findAll', () => {
    it('orders by createdAt and reports the unpaged total', async () => {
      for (const series of orderedSeries()) {
        await seriesRepository.save(series)
      }

      const page = await seriesRepository.findAll({ limit: 2, offset: 0 })

      expect(page.total).toBe(3)
      expect(page.items).toHaveLength(2)
      expect(page.items.map((s) => s.data.title.value)).toEqual(['First', 'Second'])
    })

    it('honours the offset', async () => {
      // Saved newest-first to prove the ordering comes from createdAt, not
      // from insertion order.
      for (const series of orderedSeries().reverse()) {
        await seriesRepository.save(series)
      }

      const page = await seriesRepository.findAll({ limit: 2, offset: 2 })

      expect(page.total).toBe(3)
      expect(page.items.map((s) => s.data.title.value)).toEqual(['Third'])
    })

    it('returns an empty page and a zero total for an empty table', async () => {
      expect(await seriesRepository.findAll({ limit: 10, offset: 0 })).toEqual({
        items: [],
        total: 0,
      })
    })

    // findAll skips the joins; the mapper collapses "not loaded" to empty.
    it('rehydrates list rows without their relations', async () => {
      const genre = buildGenre()
      await genreRepository.save(genre)
      await seriesRepository.save(buildSeries({ genres: [genre] }))

      const page = await seriesRepository.findAll({ limit: 10, offset: 0 })

      expect(page.items[0].data.genres).toEqual([])
    })
  })

  it('reports existence without rehydrating', async () => {
    const series = buildSeries()
    await seriesRepository.save(series)

    expect(await seriesRepository.exists(series.id)).toBe(true)
    expect(await seriesRepository.exists('missing')).toBe(false)
  })

  it('deletes a series and cascades its join rows', async () => {
    const genre = buildGenre()
    await genreRepository.save(genre)
    const series = buildSeries({ genres: [genre] })
    await seriesRepository.save(series)

    await seriesRepository.delete(series.id)

    expect(await seriesRepository.findById(series.id)).toBeNull()
    expect(await prisma.seriesGenre.count()).toBe(0)
    // The relation rows survive — only the join rows cascade.
    expect(await genreRepository.findById(genre.id)).not.toBeNull()
  })
})
