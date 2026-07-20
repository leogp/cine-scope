import express, { Application } from 'express'
import { AuthController } from './controllers/authController'
import { errorHandler } from './middlewares/errorHandler'
import { notFoundHandler } from './middlewares/notFoundHandler'
import { buildAuthRoutes } from './routes/authRoutes'
import { buildHealthRoutes } from './routes/healthRoutes'

export const buildApp = (authController: AuthController): Application => {
  const app = express()

  app.use(express.json())

  app.use(buildHealthRoutes())
  app.use('/auth', buildAuthRoutes(authController))

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
