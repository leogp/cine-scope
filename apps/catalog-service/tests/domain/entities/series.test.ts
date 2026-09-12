import { Series, SeriesProps } from '@catalog/domain/entities/series'
import { LanguageCode } from '@catalog/domain/value-objects/languageCode'
import { MovieTitle } from '@catalog/domain/value-objects/movieTitle'

const buildProps = (overrides: Partial<SeriesProps> = {}): SeriesProps => ({
  id: 'series-1',
  title: new MovieTitle('Fleabag'),
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
  createdAt: new Date('2020-01-01T00:00:00Z'),
  updatedAt: new Date('2020-01-01T00:00:00Z'),
  ...overrides,
})

describe('Series', () => {
  describe('create', () => {
    it('generates an id and timestamps', () => {
      const series = Series.create({
        title: new MovieTitle('The Bear'),
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
      })

      expect(series.id).toEqual(expect.any(String))
      expect(series.id).not.toBe('')
      expect(series.data.title.value).toBe('The Bear')
      expect(series.data.createdAt).toBeInstanceOf(Date)
    })
  })

  describe('restore', () => {
    it('preserves the supplied id and timestamps', () => {
      const props = buildProps()
      const series = Series.restore(props)

      expect(series.id).toBe('series-1')
      expect(series.data.createdAt).toBe(props.createdAt)
    })
  })

  describe('changeTitle', () => {
    it('replaces the title and refreshes updatedAt', () => {
      const series = Series.restore(buildProps())

      series.changeTitle(new MovieTitle('Succession'))

      expect(series.data.title.value).toBe('Succession')
      expect(series.data.updatedAt.getTime()).toBeGreaterThan(
        new Date('2020-01-01T00:00:00Z').getTime()
      )
    })
  })
})
