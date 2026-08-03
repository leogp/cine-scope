import { Movie, MovieProps } from '@catalog/domain/entities/movie'
import { Duration } from '@catalog/domain/value-objects/duration'
import { LanguageCode } from '@catalog/domain/value-objects/languageCode'
import { MovieTitle } from '@catalog/domain/value-objects/movieTitle'
import { buildGenre, buildMovie, buildPerson, buildCompany } from '../../helpers/builders'

const buildProps = (overrides: Partial<MovieProps> = {}): MovieProps => ({
  id: 'movie-1',
  title: new MovieTitle('Lady Bird'),
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
  createdAt: new Date('2020-01-01T00:00:00Z'),
  updatedAt: new Date('2020-01-01T00:00:00Z'),
  ...overrides,
})

const PAST = new Date('2020-01-01T00:00:00Z').getTime()

describe('Movie', () => {
  describe('create', () => {
    it('generates an id and timestamps', () => {
      const movie = buildMovie()

      expect(movie.id).toEqual(expect.any(String))
      expect(movie.id).not.toBe('')
      expect(movie.data.createdAt).toBeInstanceOf(Date)
      expect(movie.data.title.value).toBe('Lady Bird')
    })
  })

  describe('restore', () => {
    it('preserves the supplied id and timestamps', () => {
      const props = buildProps({ duration: Duration.create(94) })
      const movie = Movie.restore(props)

      expect(movie.id).toBe('movie-1')
      expect(movie.data.duration?.value).toBe(94)
      expect(movie.data.createdAt).toBe(props.createdAt)
    })
  })

  describe('scalar mutations', () => {
    it('changeTitle replaces the title and touches updatedAt', () => {
      const movie = Movie.restore(buildProps())

      movie.changeTitle(new MovieTitle('Little Women'))

      expect(movie.data.title.value).toBe('Little Women')
      expect(movie.data.updatedAt.getTime()).toBeGreaterThan(PAST)
    })

    it('changeDuration accepts a null value', () => {
      const movie = Movie.restore(buildProps({ duration: Duration.create(94) }))

      movie.changeDuration(null)

      expect(movie.data.duration).toBeNull()
    })

    it('changeOverview updates the overview', () => {
      const movie = Movie.restore(buildProps())

      movie.changeOverview('A coming-of-age story.')

      expect(movie.data.overview).toBe('A coming-of-age story.')
    })
  })

  describe('genres', () => {
    it('setGenres replaces the collection with a copy', () => {
      const movie = buildMovie()
      const genres = [buildGenre()]

      movie.setGenres(genres)
      genres.push(buildGenre())

      expect(movie.data.genres).toHaveLength(1)
    })

    it('addGenre appends a new genre', () => {
      const movie = buildMovie()

      movie.addGenre(buildGenre())

      expect(movie.data.genres).toHaveLength(1)
    })

    it('addGenre ignores a genre already present (by identity)', () => {
      const movie = buildMovie()
      const genre = buildGenre()

      movie.addGenre(genre)
      movie.addGenre(genre)

      expect(movie.data.genres).toHaveLength(1)
    })

    it('removeGenre removes the genre with the matching id', () => {
      const genre = buildGenre()
      const movie = buildMovie({ genres: [genre] })

      movie.removeGenre(genre.id)

      expect(movie.data.genres).toHaveLength(0)
    })

    it('removeGenre leaves other genres untouched', () => {
      const kept = buildGenre()
      const removed = buildGenre()
      const movie = buildMovie({ genres: [kept, removed] })

      movie.removeGenre(removed.id)

      expect(movie.data.genres).toHaveLength(1)
      expect(movie.data.genres[0].id).toBe(kept.id)
    })
  })

  describe('cast, directors and production companies', () => {
    it('addCastMember de-duplicates by identity', () => {
      const movie = buildMovie()
      const person = buildPerson()

      movie.addCastMember(person)
      movie.addCastMember(person)

      expect(movie.data.cast).toHaveLength(1)
    })

    it('addDirector de-duplicates by identity', () => {
      const movie = buildMovie()
      const director = buildPerson()

      movie.addDirector(director)
      movie.addDirector(director)

      expect(movie.data.directors).toHaveLength(1)
    })

    it('addProductionCompany de-duplicates by identity', () => {
      const movie = buildMovie()
      const company = buildCompany()

      movie.addProductionCompany(company)
      movie.addProductionCompany(company)

      expect(movie.data.productionCompanies).toHaveLength(1)
    })

    it('setCast replaces the collection and touches updatedAt', () => {
      const movie = Movie.restore(buildProps())

      movie.setCast([buildPerson()])

      expect(movie.data.cast).toHaveLength(1)
      expect(movie.data.updatedAt.getTime()).toBeGreaterThan(PAST)
    })
  })
})
