import { asyncHandler, validateBody, validateParams } from '@cinescope/shared/infrastructure/http'
import { Router } from 'express'

import { SeriesController } from '../controllers/seriesController'
import { idParamsSchema } from '../schemas/commonSchemas'
import { createSeriesSchema } from '../schemas/seriesSchemas'

export function buildSeriesRoutes(controller: SeriesController): Router {
  const router = Router()

  router.post('/', validateBody(createSeriesSchema), asyncHandler(controller.create))
  router.get('/:id', validateParams(idParamsSchema), asyncHandler(controller.get))

  return router
}
