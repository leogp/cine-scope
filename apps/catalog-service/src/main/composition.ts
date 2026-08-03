// http
import { CatalogControllers } from '../infrastructure/http/app'
import { CompanyController } from '../infrastructure/http/controllers/companyController'
import { SeriesController } from '../infrastructure/http/controllers/seriesController'
import { MovieController } from '../infrastructure/http/controllers/movieController'
import { PersonController } from '../infrastructure/http/controllers/personController'
import { GenreController } from '../infrastructure/http/controllers/genreController'
// prisma
import { prisma } from '../infrastructure/prisma/client'
import { PrismaCompanyRepository } from '../infrastructure/prisma/company'
import { PrismaGenreRepository } from '../infrastructure/prisma/genre'
import { PrismaMovieRepository } from '../infrastructure/prisma/movie'
import { PrismaPersonRepository } from '../infrastructure/prisma/person'
import { PrismaSeriesRepository } from '../infrastructure/prisma/series'
// use cases
import { CreateCompanyUseCase } from '../application/use-cases/company/create/createCompanyUseCase'
import { GetCompanyUseCase } from '../application/use-cases/company/get/getCompanyUseCase'
import { CreateGenreUseCase } from '../application/use-cases/genre/create/createGenreUseCase'
import { GetGenreUseCase } from '../application/use-cases/genre/get/getGenreUseCase'
import { CreateMovieUseCase } from '../application/use-cases/movie/create/createMovieUseCase'
import { DeleteMovieUseCase } from '../application/use-cases/movie/delete/deleteMovieUseCase'
import { GetMovieUseCase } from '../application/use-cases/movie/get/getMovieUseCase'
import { ListMoviesUseCase } from '../application/use-cases/movie/list/listMoviesUseCase'
import { UpdateMovieUseCase } from '../application/use-cases/movie/update/updateMovieUseCase'
import { CreatePersonUseCase } from '../application/use-cases/person/create/createPersonUseCase'
import { GetPersonUseCase } from '../application/use-cases/person/get/getPersonUseCase'
import { CreateSeriesUseCase } from '../application/use-cases/series/create/createSeriesUseCase'
import { GetSeriesUseCase } from '../application/use-cases/series/get/getSeriesUseCase'

export function composeApp(): CatalogControllers {
  // Repositories
  const companyRepository = new PrismaCompanyRepository(prisma)
  const genreRepository = new PrismaGenreRepository(prisma)
  const personRepository = new PrismaPersonRepository(prisma)
  const movieRepository = new PrismaMovieRepository(prisma)
  const seriesRepository = new PrismaSeriesRepository(prisma)

  // Company Use Cases
  const createCompanyUseCase = new CreateCompanyUseCase(companyRepository)
  const getCompanyUseCase = new GetCompanyUseCase(companyRepository)
  // Genre Use Cases
  const createGenreUseCase = new CreateGenreUseCase(genreRepository)
  const getGenreUseCase = new GetGenreUseCase(genreRepository)
  // Person Use Cases
  const createPersonUseCase = new CreatePersonUseCase(personRepository)
  const getPersonUseCase = new GetPersonUseCase(personRepository)
  // Movie Use Cases
  const createMovieUseCase = new CreateMovieUseCase(
    movieRepository,
    genreRepository,
    personRepository,
    companyRepository
  )
  const getMovieUseCase = new GetMovieUseCase(movieRepository)
  const listMoviesUseCase = new ListMoviesUseCase(movieRepository)
  const updateMovieUseCase = new UpdateMovieUseCase(
    movieRepository,
    genreRepository,
    personRepository,
    companyRepository
  )
  const deleteMovieUseCase = new DeleteMovieUseCase(movieRepository)
  // Series Use Cases
  const createSeriesUseCase = new CreateSeriesUseCase(
    seriesRepository,
    genreRepository,
    personRepository,
    companyRepository
  )
  const getSeriesUseCase = new GetSeriesUseCase(seriesRepository)

  // Controllers
  return {
    movie: new MovieController(
      createMovieUseCase,
      getMovieUseCase,
      listMoviesUseCase,
      updateMovieUseCase,
      deleteMovieUseCase
    ),
    series: new SeriesController(createSeriesUseCase, getSeriesUseCase),
    genre: new GenreController(createGenreUseCase, getGenreUseCase),
    company: new CompanyController(createCompanyUseCase, getCompanyUseCase),
    person: new PersonController(createPersonUseCase, getPersonUseCase),
  }
}
