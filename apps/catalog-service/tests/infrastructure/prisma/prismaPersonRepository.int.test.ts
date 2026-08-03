import { PersonName } from '../../../src/domain/value-objects/personName'
import { PrismaPersonRepository } from '../../../src/infrastructure/prisma/person'
import { buildPerson } from '../../helpers/builders'
import { createTestPrisma, truncateAll } from '../../helpers/testDb'

const prisma = createTestPrisma()
const personRepository = new PrismaPersonRepository(prisma)

beforeEach(async () => {
  await truncateAll(prisma)
})

afterAll(async () => {
  await prisma.$disconnect()
})

describe('PrismaPersonRepository', () => {
  it('saves a person and rehydrates it by id', async () => {
    const person = buildPerson()

    await personRepository.save(person)
    const found = await personRepository.findById(person.id)

    expect(found).not.toBeNull()
    expect(found!.id).toBe(person.id)
    expect(found!.data.name.value).toBe('Greta Gerwig')
  })

  it('round-trips the nullable fields', async () => {
    const person = buildPerson({ biography: 'Director and actor.', profilePath: '/greta.jpg' })

    await personRepository.save(person)
    const found = await personRepository.findById(person.id)

    expect(found!.data.biography).toBe('Director and actor.')
    expect(found!.data.profilePath).toBe('/greta.jpg')
  })

  // `birthDate` is `@db.Date`, so Postgres stores the UTC calendar day and
  // drops the time — the value has to come back as that same midnight instant.
  it('round-trips a birth date as a calendar day', async () => {
    const person = buildPerson({ birthDate: new Date('1983-08-04T00:00:00.000Z') })

    await personRepository.save(person)
    const found = await personRepository.findById(person.id)

    expect(found!.data.birthDate).toEqual(new Date('1983-08-04T00:00:00.000Z'))
  })

  it('returns null for an unknown id', async () => {
    expect(await personRepository.findById('missing')).toBeNull()
  })

  it('overwrites an existing row on a second save', async () => {
    const person = buildPerson()
    await personRepository.save(person)

    person.changeName(new PersonName('Saoirse Ronan'))
    await personRepository.save(person)

    const found = await personRepository.findById(person.id)
    expect(found!.data.name.value).toBe('Saoirse Ronan')
    expect(await prisma.person.count()).toBe(1)
  })

  it('reports existence without rehydrating', async () => {
    const person = buildPerson()
    await personRepository.save(person)

    expect(await personRepository.exists(person.id)).toBe(true)
    expect(await personRepository.exists('missing')).toBe(false)
  })

  it('deletes a person', async () => {
    const person = buildPerson()
    await personRepository.save(person)

    await personRepository.delete(person.id)

    expect(await personRepository.findById(person.id)).toBeNull()
  })
})
