import {
  asyncHandler,
  validateBody,
  validateParams,
  validateQuery,
} from '@cinescope/shared/infrastructure/http'
import { RequestHandler, Router } from 'express'

import { SeriesController } from '../controllers/seriesController'
import { idParamsSchema, paginationQuerySchema } from '../schemas/commonSchemas'
import { createSeriesSchema, updateSeriesSchema } from '../schemas/seriesSchemas'

export function buildSeriesRoutes(
  controller: SeriesController,
  writeGuards: readonly RequestHandler[]
): Router {
  const router = Router()

  // validateQuery is what makes the controller's `req.query as ListSeriesRequest`
  // truthful — without the coercion, page/pageSize arrive as strings and
  // normalizePagination silently falls back to its defaults.
  router.get('/', validateQuery(paginationQuerySchema), asyncHandler(controller.list))
  // Guards precede validation so an anonymous caller gets 401 rather than a 400
  // that would leak the schema.
  router.post(
    '/',
    ...writeGuards,
    validateBody(createSeriesSchema),
    asyncHandler(controller.create)
  )
  router.get('/:id', validateParams(idParamsSchema), asyncHandler(controller.get))
  router.put(
    '/:id',
    ...writeGuards,
    validateParams(idParamsSchema),
    validateBody(updateSeriesSchema),
    asyncHandler(controller.update)
  )

  return router
}
