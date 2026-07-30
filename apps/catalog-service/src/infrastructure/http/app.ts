import { buildHealthRoutes, notFoundHandler } from '@cinescope/shared/infrastructure/http'
import express, { Application } from 'express'
import { errorHandler } from './middlewares/errorHandler'

import { MovieController } from './controllers/movieController'
import { SeriesController } from './controllers/seriesController'
import { GenreController } from './controllers/genreController'
import { CompanyController } from './controllers/companyController'
import { PersonController } from './controllers/personController'

import { buildMovieRoutes } from './routes/movieRoutes'
import { buildSeriesRoutes } from './routes/seriesRoutes'
import { buildGenreRoutes } from './routes/genreRoutes'
import { buildCompanyRoutes } from './routes/companyRoutes'
import { buildPersonRoutes } from './routes/personRoutes'

/**
 * Keyed rather than positional on purpose: the series, genre, company and
 * person controllers all expose exactly `create` and `get` with identical
 * signatures, so they are structurally interchangeable to TypeScript.
 * Positional args would let a swapped pair compile and mount the wrong
 * use cases; named keys make the binding checkable.
 */
export interface CatalogControllers {
  movie: MovieController
  series: SeriesController
  genre: GenreController
  company: CompanyController
  person: PersonController
}

export const buildApp = (controllers: CatalogControllers): Application => {
  const app = express()

  app.use(express.json())

  app.use(buildHealthRoutes('catalog-service'))
  app.use('/movies', buildMovieRoutes(controllers.movie))
  app.use('/series', buildSeriesRoutes(controllers.series))
  app.use('/genres', buildGenreRoutes(controllers.genre))
  app.use('/companies', buildCompanyRoutes(controllers.company))
  app.use('/people', buildPersonRoutes(controllers.person))

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
