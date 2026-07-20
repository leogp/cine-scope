import { Router } from 'express'

export function buildHealthRoutes(): Router {
  const router = Router()

  router.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'auth-service' })
  })

  return router
}
