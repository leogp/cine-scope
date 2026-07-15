import { Router } from 'express'

import { AuthController } from '../controllers/authController'
import { asyncHandler } from '../middlewares/asyncHandler'
import { validateBody } from '../middlewares/validateRequest'
import { signUpSchema } from '../schemas/authSchemas'

export function buildAuthRoutes(controller: AuthController): Router {
  const router = Router()

  router.post('/signup', validateBody(signUpSchema), asyncHandler(controller.signUp))

  return router
}
