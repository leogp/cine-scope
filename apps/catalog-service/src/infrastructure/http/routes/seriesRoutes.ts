import { asyncHandler, validateBody, validateParams } from '@cinescope/shared/infrastructure/http'
import { RequestHandler, Router } from 'express'

import { SeriesController } from '../controllers/seriesController'
import { idParamsSchema } from '../schemas/commonSchemas'
import { createSeriesSchema } from '../schemas/seriesSchemas'

export function buildSeriesRoutes(
  controller: SeriesController,
  writeGuards: readonly RequestHandler[]
): Router {
  const router = Router()

  router.post(
    '/',
    ...writeGuards,
    validateBody(createSeriesSchema),
    asyncHandler(controller.create)
  )
  router.get('/:id', validateParams(idParamsSchema), asyncHandler(controller.get))

  return router
}
