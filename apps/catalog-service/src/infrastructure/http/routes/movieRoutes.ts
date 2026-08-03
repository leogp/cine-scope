import {
  asyncHandler,
  validateBody,
  validateParams,
  validateQuery,
} from '@cinescope/shared/infrastructure/http'
import { Router } from 'express'

import { MovieController } from '../controllers/movieController'
import { idParamsSchema, paginationQuerySchema } from '../schemas/commonSchemas'
import { createMovieSchema, updateMovieSchema } from '../schemas/movieSchemas'

export function buildMovieRoutes(controller: MovieController): Router {
  const router = Router()

  // validateQuery is what makes the controller's `req.query as ListMoviesRequest`
  // truthful — without the coercion, page/pageSize arrive as strings and
  // normalizePagination silently falls back to its defaults.
  router.get('/', validateQuery(paginationQuerySchema), asyncHandler(controller.list))
  router.post('/', validateBody(createMovieSchema), asyncHandler(controller.create))
  router.get('/:id', validateParams(idParamsSchema), asyncHandler(controller.get))
  router.put(
    '/:id',
    validateParams(idParamsSchema),
    validateBody(updateMovieSchema),
    asyncHandler(controller.update)
  )
  router.delete('/:id', validateParams(idParamsSchema), asyncHandler(controller.delete))

  return router
}
