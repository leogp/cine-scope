import { asyncHandler, validateBody } from '@cinescope/shared/infrastructure/http'
import { Router } from 'express'

import { PersonController } from '../controllers/personController'
import { createPersonSchema } from '../schemas/personSchemas'

export function buildPersonRoutes(controller: PersonController): Router {
  const router = Router()

  router.post('/person', validateBody(createPersonSchema), asyncHandler(controller.create))
  router.get('/person/:id', asyncHandler(controller.get))

  return router
}
