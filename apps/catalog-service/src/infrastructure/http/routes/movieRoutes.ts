import { asyncHandler, validateBody } from '@cinescope/shared/infrastructure/http'
import { Router } from 'express'

import { MovieController } from '../controllers/movieController'
import { createMovieSchema } from '../schemas/movieSchemas'

export function buildMovieRoutes(controller: MovieController): Router {
  const router = Router()

  router.get('/', asyncHandler(controller.list))
  router.post('/', validateBody(createMovieSchema), asyncHandler(controller.create))
  router.get('/:id', asyncHandler(controller.get))
  router.put('/:id', validateBody(createMovieSchema), asyncHandler(controller.update))
  router.delete('/:id', asyncHandler(controller.delete))

  return router
}
