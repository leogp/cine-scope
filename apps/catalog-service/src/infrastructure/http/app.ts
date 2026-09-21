import { buildHealthRoutes, notFoundHandler } from '@cinescope/shared/infrastructure/http'
import express, { Application, RequestHandler } from 'express'
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

/**
 * Guards applied to every write route — authentication followed by the
 * `catalog:write` permission check.
 *
 * Injected rather than built here so the JWT secret stays in the composition
 * root, and mounted per route rather than app- or prefix-wide: `/movies` serves
 * both reads and writes, and the catalog is public to read.
 */
export const buildApp = (
  controllers: CatalogControllers,
  writeGuards: readonly RequestHandler[]
): Application => {
  const app = express()

  app.use(express.json())

  app.use(buildHealthRoutes('catalog-service'))
  app.use('/movies', buildMovieRoutes(controllers.movie, writeGuards))
  app.use('/series', buildSeriesRoutes(controllers.series, writeGuards))
  app.use('/genres', buildGenreRoutes(controllers.genre, writeGuards))
  app.use('/companies', buildCompanyRoutes(controllers.company, writeGuards))
  app.use('/people', buildPersonRoutes(controllers.person, writeGuards))

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
