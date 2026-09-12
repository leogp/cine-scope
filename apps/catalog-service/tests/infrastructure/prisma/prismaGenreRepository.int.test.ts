import { GenreName } from '@catalog/domain/value-objects/genreName'
import { PrismaGenreRepository } from '@catalog/infrastructure/prisma/genre'
import { buildGenre } from '../../helpers/builders'
import { createTestPrisma, truncateAll } from '../../helpers/testDb'

const prisma = createTestPrisma()
const genreRepository = new PrismaGenreRepository(prisma)

beforeEach(async () => {
  await truncateAll(prisma)
})

afterAll(async () => {
  await prisma.$disconnect()
})

describe('PrismaGenreRepository', () => {
  it('saves a genre and rehydrates it by id', async () => {
    const genre = buildGenre()

    await genreRepository.save(genre)
    const found = await genreRepository.findById(genre.id)

    expect(found).not.toBeNull()
    expect(found!.id).toBe(genre.id)
    expect(found!.data.name.value).toBe('Drama')
  })

  it('rehydrates the aggregate timestamps rather than the column defaults', async () => {
    const genre = buildGenre()

    await genreRepository.save(genre)
    const found = await genreRepository.findById(genre.id)

    expect(found!.data.createdAt).toEqual(genre.data.createdAt)
    expect(found!.data.updatedAt).toEqual(genre.data.updatedAt)
  })

  it('finds a genre by its unique name', async () => {
    const genre = buildGenre()
    await genreRepository.save(genre)

    const found = await genreRepository.findByName('Drama')

    expect(found!.id).toBe(genre.id)
  })

  it('returns null for an unknown id or name', async () => {
    expect(await genreRepository.findById('missing')).toBeNull()
    expect(await genreRepository.findByName('Western')).toBeNull()
  })

  // save() upserts: the port has no separate update, so a second save of the
  // same id has to overwrite rather than violate the primary key.
  it('overwrites an existing row on a second save', async () => {
    const genre = buildGenre()
    await genreRepository.save(genre)

    genre.rename(new GenreName('Comedy'))
    await genreRepository.save(genre)

    const found = await genreRepository.findById(genre.id)
    expect(found!.data.name.value).toBe('Comedy')
    expect(await prisma.genre.count()).toBe(1)
  })

  it('reports existence without rehydrating', async () => {
    const genre = buildGenre()
    await genreRepository.save(genre)

    expect(await genreRepository.exists(genre.id)).toBe(true)
    expect(await genreRepository.exists('missing')).toBe(false)
  })

  it('deletes a genre', async () => {
    const genre = buildGenre()
    await genreRepository.save(genre)

    await genreRepository.delete(genre.id)

    expect(await genreRepository.findById(genre.id)).toBeNull()
  })
})
