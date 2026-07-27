import { buildHealthRoutes, notFoundHandler } from '@cinescope/shared/infrastructure/http'
import express, { Application } from 'express'
import { AuthController } from './controllers/authController'
import { errorHandler } from './middlewares/errorHandler'
import { buildAuthRoutes } from './routes/authRoutes'

export const buildApp = (authController: AuthController): Application => {
  const app = express()

  app.use(express.json())

  app.use(buildHealthRoutes('auth-service'))
  app.use('/auth', buildAuthRoutes(authController))

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
