import { buildHealthRoutes, notFoundHandler } from '@cinescope/shared/infrastructure/http'
import express, { Application } from 'express'
import { AuthController } from './controllers/authController'
import { errorHandler } from './middlewares/errorHandler'
import { buildAuthRoutes } from './routes/authRoutes'

export const buildApp = (authController: AuthController): Application => {
  const app = express()

  app.use(express.json())

  app.use(buildHealthRoutes('auth-service'))
  // Mounted at the root, like every other service: the public `/auth` prefix is
  // the gateway's to own. Self-prefixing here would stack with the gateway's
  // mount and expose the routes as /auth/auth/login.
  app.use(buildAuthRoutes(authController))

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
