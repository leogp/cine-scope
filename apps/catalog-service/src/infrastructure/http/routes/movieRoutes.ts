import { asyncHandler, validateBody } from '@cinescope/shared/infrastructure/http'
import { Router } from 'express'

import { MovieController } from '../controllers/movieController'
import { createMovieSchema } from '../schemas/movieSchemas'

export function buildMovieRoutes(controller: MovieController): Router {
  const router = Router()

  router.get('/movies', asyncHandler(controller.list))
  router.post('/movies', validateBody(createMovieSchema), asyncHandler(controller.create))
  router.get('/movies/:id', asyncHandler(controller.get))
  router.put('/movies/:id', validateBody(createMovieSchema), asyncHandler(controller.update))
  router.delete('/movies/:id', asyncHandler(controller.delete))

  return router
}
