import { Application } from 'express'

import { CreateCompanyUseCase } from '../../src/application/use-cases/company/create/createCompanyUseCase'
import { GetCompanyUseCase } from '../../src/application/use-cases/company/get/getCompanyUseCase'
import { CreateGenreUseCase } from '../../src/application/use-cases/genre/create/createGenreUseCase'
import { GetGenreUseCase } from '../../src/application/use-cases/genre/get/getGenreUseCase'
import { CreateMovieUseCase } from '../../src/application/use-cases/movie/create/createMovieUseCase'
import { DeleteMovieUseCase } from '../../src/application/use-cases/movie/delete/deleteMovieUseCase'
import { GetMovieUseCase } from '../../src/application/use-cases/movie/get/getMovieUseCase'
import { ListMoviesUseCase } from '../../src/application/use-cases/movie/list/listMoviesUseCase'
import { UpdateMovieUseCase } from '../../src/application/use-cases/movie/update/updateMovieUseCase'
import { CreatePersonUseCase } from '../../src/application/use-cases/person/create/createPersonUseCase'
import { GetPersonUseCase } from '../../src/application/use-cases/person/get/getPersonUseCase'
import { CreateSeriesUseCase } from '../../src/application/use-cases/series/create/createSeriesUseCase'
import { GetSeriesUseCase } from '../../src/application/use-cases/series/get/getSeriesUseCase'
import { buildApp } from '../../src/infrastructure/http/app'
import { CompanyController } from '../../src/infrastructure/http/controllers/companyController'
import { GenreController } from '../../src/infrastructure/http/controllers/genreController'
import { MovieController } from '../../src/infrastructure/http/controllers/movieController'
import { PersonController } from '../../src/infrastructure/http/controllers/personController'
import { SeriesController } from '../../src/infrastructure/http/controllers/seriesController'
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
