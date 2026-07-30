import { asyncHandler, validateBody, validateParams } from '@cinescope/shared/infrastructure/http'
import { Router } from 'express'

import { GenreController } from '../controllers/genreController'
import { idParamsSchema } from '../schemas/commonSchemas'
import { createGenreSchema } from '../schemas/genreSchemas'

export function buildGenreRoutes(controller: GenreController): Router {
  const router = Router()

  router.post('/', validateBody(createGenreSchema), asyncHandler(controller.create))
  router.get('/:id', validateParams(idParamsSchema), asyncHandler(controller.get))

  return router
}
