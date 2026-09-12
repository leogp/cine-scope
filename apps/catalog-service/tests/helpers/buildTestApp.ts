import { Application } from 'express'

import { CreateCompanyUseCase } from '@catalog/application/use-cases/company/create/createCompanyUseCase'
import { GetCompanyUseCase } from '@catalog/application/use-cases/company/get/getCompanyUseCase'
import { CreateGenreUseCase } from '@catalog/application/use-cases/genre/create/createGenreUseCase'
import { GetGenreUseCase } from '@catalog/application/use-cases/genre/get/getGenreUseCase'
import { CreateMovieUseCase } from '@catalog/application/use-cases/movie/create/createMovieUseCase'
import { DeleteMovieUseCase } from '@catalog/application/use-cases/movie/delete/deleteMovieUseCase'
import { GetMovieUseCase } from '@catalog/application/use-cases/movie/get/getMovieUseCase'
import { ListMoviesUseCase } from '@catalog/application/use-cases/movie/list/listMoviesUseCase'
import { UpdateMovieUseCase } from '@catalog/application/use-cases/movie/update/updateMovieUseCase'
import { CreatePersonUseCase } from '@catalog/application/use-cases/person/create/createPersonUseCase'
import { GetPersonUseCase } from '@catalog/application/use-cases/person/get/getPersonUseCase'
import { CreateSeriesUseCase } from '@catalog/application/use-cases/series/create/createSeriesUseCase'
import { GetSeriesUseCase } from '@catalog/application/use-cases/series/get/getSeriesUseCase'
import { buildApp } from '@catalog/infrastructure/http/app'
import { CompanyController } from '@catalog/infrastructure/http/controllers/companyController'
import { GenreController } from '@catalog/infrastructure/http/controllers/genreController'
import { MovieController } from '@catalog/infrastructure/http/controllers/movieController'
import { PersonController } from '@catalog/infrastructure/http/controllers/personController'
import { SeriesController } from '@catalog/infrastructure/http/controllers/seriesController'
import { InMemoryCompanyRepository } from '../fakes/inMemoryCompanyRepository'
import { InMemoryGenreRepository } from '../fakes/inMemoryGenreRepository'
import { InMemoryMovieRepository } from '../fakes/inMemoryMovieRepository'
import { InMemoryPersonRepository } from '../fakes/inMemoryPersonRepository'
import { InMemorySeriesRepository } from '../fakes/inMemorySeriesRepository'

interface TestApp {
  app: Application
  movieRepository: InMemoryMovieRepository
  seriesRepository: InMemorySeriesRepository
  genreRepository: InMemoryGenreRepository
  personRepository: InMemoryPersonRepository
  companyRepository: InMemoryCompanyRepository
}

/**
 * Real use cases, controllers and Express app wired against in-memory fakes:
 * the whole HTTP layer under test without a database. Mirrors
 * `src/main/composition.ts`, swapping only the repository implementations.
 */
export const buildTestApp = (): TestApp => {
  const movieRepository = new InMemoryMovieRepository()
  const seriesRepository = new InMemorySeriesRepository()
  const genreRepository = new InMemoryGenreRepository()
  const personRepository = new InMemoryPersonRepository()
  const companyRepository = new InMemoryCompanyRepository()

  const app = buildApp({
    movie: new MovieController(
      new CreateMovieUseCase(movieRepository, genreRepository, personRepository, companyRepository),
      new GetMovieUseCase(movieRepository),
      new ListMoviesUseCase(movieRepository),
      new UpdateMovieUseCase(movieRepository, genreRepository, personRepository, companyRepository),
      new DeleteMovieUseCase(movieRepository)
    ),
    series: new SeriesController(
      new CreateSeriesUseCase(
        seriesRepository,
        genreRepository,
        personRepository,
        companyRepository
      ),
      new GetSeriesUseCase(seriesRepository)
    ),
    genre: new GenreController(
      new CreateGenreUseCase(genreRepository),
      new GetGenreUseCase(genreRepository)
    ),
    company: new CompanyController(
      new CreateCompanyUseCase(companyRepository),
      new GetCompanyUseCase(companyRepository)
    ),
    person: new PersonController(
      new CreatePersonUseCase(personRepository),
      new GetPersonUseCase(personRepository)
    ),
  })

  return {
    app,
    movieRepository,
    seriesRepository,
    genreRepository,
    personRepository,
    companyRepository,
  }
}

export const validMovieBody = {
  title: 'Lady Bird',
  overview: null,
  releaseDate: null,
  duration: 94,
  originalLanguage: 'en',
  posterPath: null,
  backdropPath: null,
  genreIds: [],
  castIds: [],
  directorIds: [],
  companyIds: [],
}

export const validSeriesBody = {
  title: 'Fleabag',
  overview: null,
  firstAirDate: null,
  lastAirDate: null,
  originalLanguage: 'en',
  posterPath: null,
  backdropPath: null,
  genreIds: [],
  castIds: [],
  directorIds: [],
  companyIds: [],
}

export const validPersonBody = {
  name: 'Greta Gerwig',
  biography: null,
  birthDate: null,
  profilePath: null,
}

export const validGenreBody = { name: 'Drama' }

export const validCompanyBody = {
  name: 'A24',
  logoPath: null,
  countryCode: 'US',
}
