import { asyncHandler, validateBody, validateParams } from '@cinescope/shared/infrastructure/http'
import { Router } from 'express'

import { CompanyController } from '../controllers/companyController'
import { idParamsSchema } from '../schemas/commonSchemas'
import { createCompanySchema } from '../schemas/companySchemas'

export function buildCompanyRoutes(controller: CompanyController): Router {
  const router = Router()

  router.post('/', validateBody(createCompanySchema), asyncHandler(controller.create))
  router.get('/:id', validateParams(idParamsSchema), asyncHandler(controller.get))

  return router
}
