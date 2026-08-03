import { asyncHandler, validateBody, validateParams } from '@cinescope/shared/infrastructure/http'
import { Router } from 'express'

import { PersonController } from '../controllers/personController'
import { idParamsSchema } from '../schemas/commonSchemas'
import { createPersonSchema } from '../schemas/personSchemas'

export function buildPersonRoutes(controller: PersonController): Router {
  const router = Router()

  router.post('/', validateBody(createPersonSchema), asyncHandler(controller.create))
  router.get('/:id', validateParams(idParamsSchema), asyncHandler(controller.get))

  return router
}
