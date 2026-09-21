import { asyncHandler, validateBody, validateParams } from '@cinescope/shared/infrastructure/http'
import { RequestHandler, Router } from 'express'

import { CompanyController } from '../controllers/companyController'
import { idParamsSchema } from '../schemas/commonSchemas'
import { createCompanySchema } from '../schemas/companySchemas'

export function buildCompanyRoutes(
  controller: CompanyController,
  writeGuards: readonly RequestHandler[]
): Router {
  const router = Router()

  router.post(
    '/',
    ...writeGuards,
    validateBody(createCompanySchema),
    asyncHandler(controller.create)
  )
  router.get('/:id', validateParams(idParamsSchema), asyncHandler(controller.get))

  return router
}
