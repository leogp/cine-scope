import {
  asyncHandler,
  validateBody,
  validateParams,
  validateQuery,
} from '@cinescope/shared/infrastructure/http'
import { RequestHandler, Router } from 'express'

import { SeriesController } from '../controllers/seriesController'
import { idParamsSchema, paginationQuerySchema } from '../schemas/commonSchemas'
import { createSeriesSchema } from '../schemas/seriesSchemas'

export function buildSeriesRoutes(
  controller: SeriesController,
  writeGuards: readonly RequestHandler[]
): Router {
  const router = Router()

  // validateQuery is what makes the controller's `req.query as ListSeriesRequest`
  // truthful — without the coercion, page/pageSize arrive as strings and
  // normalizePagination silently falls back to its defaults.
  router.get('/', validateQuery(paginationQuerySchema), asyncHandler(controller.list))
  router.post(
    '/',
    ...writeGuards,
    validateBody(createSeriesSchema),
    asyncHandler(controller.create)
  )
  router.get('/:id', validateParams(idParamsSchema), asyncHandler(controller.get))

  return router
}
