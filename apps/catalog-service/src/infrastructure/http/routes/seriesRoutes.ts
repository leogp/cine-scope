import { asyncHandler, validateBody } from '@cinescope/shared/infrastructure/http'
import { Router } from 'express'

import { SeriesController } from '../controllers/seriesController'
import { createSeriesSchema } from '../schemas/seriesSchemas'

export function buildSeriesRoutes(controller: SeriesController): Router {
  const router = Router()

  router.post('/series', validateBody(createSeriesSchema), asyncHandler(controller.create))
  router.get('/series/:id', asyncHandler(controller.get))

  return router
}
