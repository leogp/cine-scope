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

export const buildApp = (
  movieController: MovieController,
  seriesController: SeriesController,
  genreController: GenreController,
  companyController: CompanyController,
  personController: PersonController
): Application => {
  const app = express()

  app.use(express.json())

  app.use(buildHealthRoutes('catalog-service'))
  app.use('/movies', buildMovieRoutes(movieController))
  app.use('/series', buildSeriesRoutes(seriesController))
  app.use('/genre', buildGenreRoutes(genreController))
  app.use('/company', buildCompanyRoutes(companyController))
  app.use('/person', buildPersonRoutes(personController))

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
