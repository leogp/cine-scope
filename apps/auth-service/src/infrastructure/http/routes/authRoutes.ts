import { Router } from 'express'

import { AuthController } from '../controllers/authController'
import { asyncHandler } from '../middlewares/asyncHandler'
import { validateBody } from '../middlewares/validateRequest'
import { logoutSchema, refreshSchema, signUpSchema, loginSchema } from '../schemas/authSchemas'

export function buildAuthRoutes(controller: AuthController): Router {
  const router = Router()

  router.post('/signup', validateBody(signUpSchema), asyncHandler(controller.signUp))
  router.post('/login', validateBody(loginSchema), asyncHandler(controller.login))
  router.post('/refresh', validateBody(refreshSchema), asyncHandler(controller.refresh))
  router.post('/logout', validateBody(logoutSchema), asyncHandler(controller.logout))

  return router
}
