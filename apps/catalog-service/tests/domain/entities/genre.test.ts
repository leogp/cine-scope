import { Genre, GenreProps } from '../../../src/domain/entities/genre'
import { GenreName } from '../../../src/domain/value-objects/genreName'

const buildProps = (overrides: Partial<GenreProps> = {}): GenreProps => ({
  id: 'genre-1',
  name: new GenreName('Drama'),
  createdAt: new Date('2020-01-01T00:00:00Z'),
  updatedAt: new Date('2020-01-01T00:00:00Z'),
  ...overrides,
})

describe('Genre', () => {
  describe('create', () => {
    it('generates an id and timestamps', () => {
      const genre = Genre.create({ name: new GenreName('Comedy') })

      expect(genre.id).toEqual(expect.any(String))
      expect(genre.id).not.toBe('')
      expect(genre.data.createdAt).toBeInstanceOf(Date)
      expect(genre.data.updatedAt).toBeInstanceOf(Date)
      expect(genre.data.name.value).toBe('Comedy')
    })
  })

  describe('restore', () => {
    it('preserves the supplied id and timestamps', () => {
      const props = buildProps()
      const genre = Genre.restore(props)

      expect(genre.id).toBe('genre-1')
      expect(genre.data.createdAt).toBe(props.createdAt)
      expect(genre.data.updatedAt).toBe(props.updatedAt)
    })
  })

  describe('rename', () => {
    it('replaces the name and refreshes updatedAt', () => {
      const genre = Genre.restore(buildProps())

      genre.rename(new GenreName('Thriller'))

      expect(genre.data.name.value).toBe('Thriller')
      expect(genre.data.updatedAt.getTime()).toBeGreaterThan(
        new Date('2020-01-01T00:00:00Z').getTime()
      )
    })
  })
})
