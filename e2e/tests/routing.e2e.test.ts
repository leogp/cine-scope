import { api } from '../support/http'
import { PROXIED_SERVICES } from '../support/services'

describe('prefix rewriting', () => {
  // Each service serves /health at its own root and names itself there, so a
  // 200 with this name means the gateway chose this target and stripped the
  // prefix: /catalog/health reached catalog as /health.
  it.each(PROXIED_SERVICES)(
    'GET $prefix/health reaches $service as /health',
    async ({ prefix, service }) => {
      const response = await api(`${prefix}/health`)

      expect(response.status).toBe(200)
      expect(response.body).toEqual({ status: 'ok', service })
    }
  )
})
