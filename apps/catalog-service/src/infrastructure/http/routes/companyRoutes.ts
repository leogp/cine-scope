import { asyncHandler, validateBody } from '@cinescope/shared/infrastructure/http'
import { Router } from 'express'

import { CompanyController } from '../controllers/companyController'
import { createCompanySchema } from '../schemas/companySchemas'

export function buildCompanyRoutes(controller: CompanyController): Router {
  const router = Router()

  router.post('/', validateBody(createCompanySchema), asyncHandler(controller.create))
  router.get('/:id', asyncHandler(controller.get))

  return router
}
