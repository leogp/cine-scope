import { Company, CreateCompanyProps } from '@catalog/domain/entities/company'
import { CreateGenreProps, Genre } from '@catalog/domain/entities/genre'
import { CreateMovieProps, Movie } from '@catalog/domain/entities/movie'
import { CreatePersonProps, Person } from '@catalog/domain/entities/person'
import { CreateSeriesProps, Series } from '@catalog/domain/entities/series'
import { CompanyName } from '@catalog/domain/value-objects/companyName'
import { CountryCode } from '@catalog/domain/value-objects/countryCode'
import { GenreName } from '@catalog/domain/value-objects/genreName'
import { LanguageCode } from '@catalog/domain/value-objects/languageCode'
import { MovieTitle } from '@catalog/domain/value-objects/movieTitle'
import { PersonName } from '@catalog/domain/value-objects/personName'

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
