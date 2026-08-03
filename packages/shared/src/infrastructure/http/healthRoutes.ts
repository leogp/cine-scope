import { Router } from 'express'

export function buildHealthRoutes(serviceName: string): Router {
  const router = Router()

  router.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: serviceName })
  })

  return router
}
