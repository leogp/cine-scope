import { Series, SeriesProps } from '@catalog/domain/entities/series'
import { LanguageCode } from '@catalog/domain/value-objects/languageCode'
import { Title } from '@catalog/domain/value-objects/title'
import { buildCompany, buildGenre, buildPerson, buildSeries } from '../../helpers/builders'

const buildProps = (overrides: Partial<SeriesProps> = {}): SeriesProps => ({
  id: 'series-1',
  title: new Title('Fleabag'),
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

const PAST = new Date('2020-01-01T00:00:00Z').getTime()

describe('Series', () => {
  describe('create', () => {
    it('generates an id and timestamps', () => {
      const series = Series.create({
        title: new Title('The Bear'),
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

      series.changeTitle(new Title('Succession'))

      expect(series.data.title.value).toBe('Succession')
      expect(series.data.updatedAt.getTime()).toBeGreaterThan(PAST)
    })
  })

  describe('scalar mutations', () => {
    it('changeOverview replaces the overview', () => {
      const series = Series.restore(buildProps())

      series.changeOverview('A woman navigating grief in London.')

      expect(series.data.overview).toBe('A woman navigating grief in London.')
    })

    it('changeFirstAirDate replaces the first air date', () => {
      const series = Series.restore(buildProps())

      series.changeFirstAirDate(new Date('2016-07-21T00:00:00.000Z'))

      expect(series.data.firstAirDate).toEqual(new Date('2016-07-21T00:00:00.000Z'))
    })

    it('changeLastAirDate accepts a null value', () => {
      const series = Series.restore(
        buildProps({ lastAirDate: new Date('2019-04-08T00:00:00.000Z') })
      )

      series.changeLastAirDate(null)

      expect(series.data.lastAirDate).toBeNull()
    })

    it('changeOriginalLanguage replaces the language', () => {
      const series = Series.restore(buildProps())

      series.changeOriginalLanguage(new LanguageCode('fr'))

      expect(series.data.originalLanguage.value).toBe('fr')
    })

    it('changePosterPath replaces the poster path', () => {
      const series = Series.restore(buildProps())

      series.changePosterPath('/fleabag.jpg')

      expect(series.data.posterPath).toBe('/fleabag.jpg')
    })

    it('changeBackdropPath replaces the backdrop path', () => {
      const series = Series.restore(buildProps())

      series.changeBackdropPath('/fleabag-backdrop.jpg')

      expect(series.data.backdropPath).toBe('/fleabag-backdrop.jpg')
    })
  })

  describe('relation setters', () => {
    it('setGenres replaces the collection with a copy', () => {
      const series = buildSeries({ genres: [buildGenre()] })
      const genres = [buildGenre()]

      series.setGenres(genres)
      genres.push(buildGenre())

      expect(series.data.genres.map((g) => g.id)).toEqual([genres[0].id])
    })

    it('setCast replaces the collection with a copy', () => {
      const series = buildSeries({ cast: [buildPerson()] })
      const cast = [buildPerson()]

      series.setCast(cast)
      cast.push(buildPerson())

      expect(series.data.cast.map((p) => p.id)).toEqual([cast[0].id])
    })

    it('setDirectors replaces the collection with a copy', () => {
      const series = buildSeries({ directors: [buildPerson()] })
      const directors = [buildPerson()]

      series.setDirectors(directors)
      directors.push(buildPerson())

      expect(series.data.directors.map((p) => p.id)).toEqual([directors[0].id])
    })

    it('setProductionCompanies replaces the collection with a copy', () => {
      const series = buildSeries({ productionCompanies: [buildCompany()] })
      const companies = [buildCompany()]

      series.setProductionCompanies(companies)
      companies.push(buildCompany())

      expect(series.data.productionCompanies.map((c) => c.id)).toEqual([companies[0].id])
    })
  })

  describe('updatedAt', () => {
    it.each<[string, (series: Series) => void]>([
      ['changeOverview', (series) => series.changeOverview('Overview')],
      ['changeFirstAirDate', (series) => series.changeFirstAirDate(new Date())],
      ['changeLastAirDate', (series) => series.changeLastAirDate(null)],
      ['changeOriginalLanguage', (series) => series.changeOriginalLanguage(new LanguageCode('fr'))],
      ['changePosterPath', (series) => series.changePosterPath('/poster.jpg')],
      ['changeBackdropPath', (series) => series.changeBackdropPath(null)],
      ['setGenres', (series) => series.setGenres([])],
      ['setCast', (series) => series.setCast([])],
      ['setDirectors', (series) => series.setDirectors([])],
      ['setProductionCompanies', (series) => series.setProductionCompanies([])],
    ])('%s advances updatedAt', (_method, mutate) => {
      const series = Series.restore(buildProps())

      mutate(series)

      expect(series.data.updatedAt.getTime()).toBeGreaterThan(PAST)
    })
  })
})
