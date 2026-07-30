import { asyncHandler, validateBody } from '@cinescope/shared/infrastructure/http'
import { Router } from 'express'

import { GenreController } from '../controllers/genreController'
import { createGenreSchema } from '../schemas/genreSchemas'

export function buildGenreRoutes(controller: GenreController): Router {
  const router = Router()

  router.post('/', validateBody(createGenreSchema), asyncHandler(controller.create))
  router.get('/:id', asyncHandler(controller.get))

  return router
}
