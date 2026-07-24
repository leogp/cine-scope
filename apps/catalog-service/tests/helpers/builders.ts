import { Company, CreateCompanyProps } from '../../src/domain/entities/company'
import { CreateGenreProps, Genre } from '../../src/domain/entities/genre'
import { CreateMovieProps, Movie } from '../../src/domain/entities/movie'
import { CreatePersonProps, Person } from '../../src/domain/entities/person'
import { CreateSeriesProps, Series } from '../../src/domain/entities/series'
import { CompanyName } from '../../src/domain/value-objects/companyName'
import { CountryCode } from '../../src/domain/value-objects/countryCode'
import { GenreName } from '../../src/domain/value-objects/genreName'
import { LanguageCode } from '../../src/domain/value-objects/languageCode'
import { MovieTitle } from '../../src/domain/value-objects/movieTitle'
import { PersonName } from '../../src/domain/value-objects/personName'

export const buildCompany = (overrides: Partial<CreateCompanyProps> = {}): Company =>
  Company.create({
    name: new CompanyName('A24'),
    logoPath: null,
    countryCode: new CountryCode('US'),
    ...overrides,
  })

export const buildGenre = (overrides: Partial<CreateGenreProps> = {}): Genre =>
  Genre.create({
    name: new GenreName('Drama'),
    ...overrides,
  })

export const buildPerson = (overrides: Partial<CreatePersonProps> = {}): Person =>
  Person.create({
    name: new PersonName('Greta Gerwig'),
    biography: null,
    birthDate: null,
    profilePath: null,
    ...overrides,
  })

export const buildMovie = (overrides: Partial<CreateMovieProps> = {}): Movie =>
  Movie.create({
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
    ...overrides,
  })

export const buildSeries = (overrides: Partial<CreateSeriesProps> = {}): Series =>
  Series.create({
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
    ...overrides,
  })
