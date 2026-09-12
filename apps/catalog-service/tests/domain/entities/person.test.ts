import { Person, PersonProps } from '@catalog/domain/entities/person'
import { PersonName } from '@catalog/domain/value-objects/personName'

const buildProps = (overrides: Partial<PersonProps> = {}): PersonProps => ({
  id: 'person-1',
  name: new PersonName('Greta Gerwig'),
  biography: null,
  birthDate: null,
  profilePath: null,
  createdAt: new Date('2020-01-01T00:00:00Z'),
  updatedAt: new Date('2020-01-01T00:00:00Z'),
  ...overrides,
})

describe('Person', () => {
  describe('create', () => {
    it('generates an id and timestamps', () => {
      const person = Person.create({
        name: new PersonName('Saoirse Ronan'),
        biography: null,
        birthDate: null,
        profilePath: null,
      })

      expect(person.id).toEqual(expect.any(String))
      expect(person.id).not.toBe('')
      expect(person.data.createdAt).toBeInstanceOf(Date)
      expect(person.data.name.value).toBe('Saoirse Ronan')
    })
  })

  describe('restore', () => {
    it('preserves the supplied id and timestamps', () => {
      const props = buildProps({ biography: 'A director and actor.' })
      const person = Person.restore(props)

      expect(person.id).toBe('person-1')
      expect(person.data.biography).toBe('A director and actor.')
      expect(person.data.createdAt).toBe(props.createdAt)
    })
  })

  describe('changeName', () => {
    it('replaces the name and refreshes updatedAt', () => {
      const person = Person.restore(buildProps())

      person.changeName(new PersonName('Timothée Chalamet'))

      expect(person.data.name.value).toBe('Timothée Chalamet')
      expect(person.data.updatedAt.getTime()).toBeGreaterThan(
        new Date('2020-01-01T00:00:00Z').getTime()
      )
    })
  })
})
