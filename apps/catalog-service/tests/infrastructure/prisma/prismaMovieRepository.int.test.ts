import { randomUUID } from 'node:crypto'

import { Movie } from '../../../src/domain/entities/movie'
import { Duration } from '../../../src/domain/value-objects/duration'
import { GenreName } from '../../../src/domain/value-objects/genreName'
import { LanguageCode } from '../../../src/domain/value-objects/languageCode'
import { MovieTitle } from '../../../src/domain/value-objects/movieTitle'
import { PrismaCompanyRepository } from '../../../src/infrastructure/prisma/company'
import { PrismaGenreRepository } from '../../../src/infrastructure/prisma/genre'
import { PrismaMovieRepository } from '../../../src/infrastructure/prisma/movie'
import { PrismaPersonRepository } from '../../../src/infrastructure/prisma/person'
import { buildCompany, buildGenre, buildMovie, buildPerson } from '../../helpers/builders'
import { createTestPrisma, truncateAll } from '../../helpers/testDb'

const prisma = createTestPrisma()
const movieRepository = new PrismaMovieRepository(prisma)
const genreRepository = new PrismaGenreRepository(prisma)
const personRepository = new PrismaPersonRepository(prisma)
const companyRepository = new PrismaCompanyRepository(prisma)

/**
 * `Movie.create` mints `createdAt` from the clock, so three movies saved in a
 * row can share a millisecond and leave findAll's `[createdAt, id]` sort to be
 * decided by a random uuid. Restoring with explicit timestamps makes the
 * pagination assertions deterministic.
 */
const restoreMovie = (title: string, createdAt: Date): Movie =>
  Movie.restore({
    id: randomUUID(),
    title: new MovieTitle(title),
    overview: null,
    releaseDate: null,
    duration: null,
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

const orderedMovies = (): Movie[] => [
  restoreMovie('First', new Date('2026-01-01T00:00:00.000Z')),
  restoreMovie('Second', new Date('2026-01-02T00:00:00.000Z')),
  restoreMovie('Third', new Date('2026-01-03T00:00:00.000Z')),
]

beforeEach(async () => {
  await truncateAll(prisma)
})

afterAll(async () => {
  await prisma.$disconnect()
})

describe('PrismaMovieRepository', () => {
  it('saves a relation-less movie and rehydrates its scalars', async () => {
    const movie = buildMovie({
      duration: Duration.create(94),
      overview: 'A senior year in Sacramento.',
      posterPath: '/lady-bird.jpg',
    })

    await movieRepository.save(movie)
    const found = await movieRepository.findById(movie.id)

    expect(found).not.toBeNull()
    expect(found!.id).toBe(movie.id)
    expect(found!.data.title.value).toBe('Lady Bird')
    expect(found!.data.duration!.value).toBe(94)
    expect(found!.data.overview).toBe('A senior year in Sacramento.')
    expect(found!.data.posterPath).toBe('/lady-bird.jpg')
    expect(found!.data.originalLanguage.value).toBe('en')
  })

  it('round-trips a release date as a calendar day', async () => {
    const movie = buildMovie({ releaseDate: new Date('2017-11-03T00:00:00.000Z') })

    await movieRepository.save(movie)
    const found = await movieRepository.findById(movie.id)

    expect(found!.data.releaseDate).toEqual(new Date('2017-11-03T00:00:00.000Z'))
  })

  it('rehydrates the aggregate timestamps rather than the column defaults', async () => {
    const movie = buildMovie()

    await movieRepository.save(movie)
    const found = await movieRepository.findById(movie.id)

    expect(found!.data.createdAt).toEqual(movie.data.createdAt)
    expect(found!.data.updatedAt).toEqual(movie.data.updatedAt)
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

    const movie = buildMovie({
      genres: [genre],
      cast: [actor],
      directors: [director],
      productionCompanies: [company],
    })
    await movieRepository.save(movie)

    const found = await movieRepository.findById(movie.id)

    expect(found!.data.genres.map((g) => g.id)).toEqual([genre.id])
    expect(found!.data.cast.map((p) => p.id)).toEqual([actor.id])
    expect(found!.data.directors.map((p) => p.id)).toEqual([director.id])
    expect(found!.data.productionCompanies.map((c) => c.id)).toEqual([company.id])
    expect(found!.data.genres[0].data.name.value).toBe('Drama')
  })

  // set* are full replacements, so the update path must clear the old join
  // rows rather than accumulate them.
  it('replaces the join sets on a second save', async () => {
    // Distinct names: genres.name carries a unique index.
    const first = buildGenre({ name: new GenreName('Drama') })
    const second = buildGenre({ name: new GenreName('Comedy') })
    await genreRepository.save(first)
    await genreRepository.save(second)

    const movie = buildMovie({ genres: [first] })
    await movieRepository.save(movie)

    movie.setGenres([second])
    await movieRepository.save(movie)

    const found = await movieRepository.findById(movie.id)
    expect(found!.data.genres.map((g) => g.id)).toEqual([second.id])
    expect(await prisma.movieGenre.count()).toBe(1)
  })

  it('dedupes repeated relation ids so the composite key holds', async () => {
    const genre = buildGenre()
    await genreRepository.save(genre)

    const movie = buildMovie({ genres: [genre, genre] })

    await expect(movieRepository.save(movie)).resolves.toBeUndefined()
    expect(await prisma.movieGenre.count()).toBe(1)
  })

  it('overwrites scalars on a second save without duplicating the row', async () => {
    const movie = buildMovie()
    await movieRepository.save(movie)

    movie.changeTitle(new MovieTitle('Little Women'))
    movie.changeDuration(Duration.create(135))
    await movieRepository.save(movie)

    const found = await movieRepository.findById(movie.id)
    expect(found!.data.title.value).toBe('Little Women')
    expect(found!.data.duration!.value).toBe(135)
    expect(await prisma.movie.count()).toBe(1)
  })

  it('returns null for an unknown id', async () => {
    expect(await movieRepository.findById('missing')).toBeNull()
  })

  describe('findAll', () => {
    it('orders by createdAt and reports the unpaged total', async () => {
      for (const movie of orderedMovies()) {
        await movieRepository.save(movie)
      }

      const page = await movieRepository.findAll({ limit: 2, offset: 0 })

      expect(page.total).toBe(3)
      expect(page.items).toHaveLength(2)
      expect(page.items.map((m) => m.data.title.value)).toEqual(['First', 'Second'])
    })

    it('honours the offset', async () => {
      // Saved newest-first to prove the ordering comes from createdAt, not
      // from insertion order.
      for (const movie of orderedMovies().reverse()) {
        await movieRepository.save(movie)
      }

      const page = await movieRepository.findAll({ limit: 2, offset: 2 })

      expect(page.total).toBe(3)
      expect(page.items.map((m) => m.data.title.value)).toEqual(['Third'])
    })

    it('returns an empty page and a zero total for an empty table', async () => {
      expect(await movieRepository.findAll({ limit: 10, offset: 0 })).toEqual({
        items: [],
        total: 0,
      })
    })

    // findAll skips the joins; the mapper collapses "not loaded" to empty.
    it('rehydrates list rows without their relations', async () => {
      const genre = buildGenre()
      await genreRepository.save(genre)
      await movieRepository.save(buildMovie({ genres: [genre] }))

      const page = await movieRepository.findAll({ limit: 10, offset: 0 })

      expect(page.items[0].data.genres).toEqual([])
    })
  })

  it('reports existence without rehydrating', async () => {
    const movie = buildMovie()
    await movieRepository.save(movie)

    expect(await movieRepository.exists(movie.id)).toBe(true)
    expect(await movieRepository.exists('missing')).toBe(false)
  })

  it('deletes a movie and cascades its join rows', async () => {
    const genre = buildGenre()
    await genreRepository.save(genre)
    const movie = buildMovie({ genres: [genre] })
    await movieRepository.save(movie)

    await movieRepository.delete(movie.id)

    expect(await movieRepository.findById(movie.id)).toBeNull()
    expect(await prisma.movieGenre.count()).toBe(0)
    // The relation rows survive — only the join rows cascade.
    expect(await genreRepository.findById(genre.id)).not.toBeNull()
  })
})
