import {
  asyncHandler,
  validateBody,
  validateParams,
  validateQuery,
} from '@cinescope/shared/infrastructure/http'
import { RequestHandler, Router } from 'express'

import { MovieController } from '../controllers/movieController'
import { idParamsSchema, paginationQuerySchema } from '../schemas/commonSchemas'
import { createMovieSchema, updateMovieSchema } from '../schemas/movieSchemas'

export function buildMovieRoutes(
  controller: MovieController,
  writeGuards: readonly RequestHandler[]
): Router {
  const router = Router()

  // validateQuery is what makes the controller's `req.query as ListMoviesRequest`
  // truthful — without the coercion, page/pageSize arrive as strings and
  // normalizePagination silently falls back to its defaults.
  router.get('/', validateQuery(paginationQuerySchema), asyncHandler(controller.list))
  // Guards precede validation so an anonymous caller gets 401 rather than a 400
  // that would leak the schema.
  router.post('/', ...writeGuards, validateBody(createMovieSchema), asyncHandler(controller.create))
  router.get('/:id', validateParams(idParamsSchema), asyncHandler(controller.get))
  router.put(
    '/:id',
    ...writeGuards,
    validateParams(idParamsSchema),
    validateBody(updateMovieSchema),
    asyncHandler(controller.update)
  )
  router.delete(
    '/:id',
    ...writeGuards,
    validateParams(idParamsSchema),
    asyncHandler(controller.delete)
  )

  return router
}
