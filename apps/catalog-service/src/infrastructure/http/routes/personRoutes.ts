import { asyncHandler, validateBody, validateParams } from '@cinescope/shared/infrastructure/http'
import { RequestHandler, Router } from 'express'

import { PersonController } from '../controllers/personController'
import { idParamsSchema } from '../schemas/commonSchemas'
import { createPersonSchema } from '../schemas/personSchemas'

export function buildPersonRoutes(
  controller: PersonController,
  writeGuards: readonly RequestHandler[]
): Router {
  const router = Router()

  router.post(
    '/',
    ...writeGuards,
    validateBody(createPersonSchema),
    asyncHandler(controller.create)
  )
  router.get('/:id', validateParams(idParamsSchema), asyncHandler(controller.get))

  return router
}
