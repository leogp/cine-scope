import { AuthContext } from '../../../src/infrastructure/http/authContext'
import { requirePermission } from '../../../src/infrastructure/http/requirePermission'
import { asResponse, createMockNext, createMockRequest, createMockResponse } from './httpMocks'

const authContext = (permissions: string[]): AuthContext => ({
  userId: 'user-1',
  username: 'ripley',
  email: 'ripley@weyland.test',
  roles: ['editor'],
  permissions,
})

const requireCatalogWrite = requirePermission('catalog:write')

describe('requirePermission', () => {
  it('continues when the caller holds the permission', () => {
    const res = createMockResponse()
    const next = createMockNext()

    requireCatalogWrite(
      createMockRequest({ auth: authContext(['catalog:read', 'catalog:write']) }),
      asResponse(res),
      next
    )

    expect(next).toHaveBeenCalledTimes(1)
    expect(res.sentStatus).toBeUndefined()
  })

  it('responds 403 when the caller is authenticated but lacks the permission', () => {
    const res = createMockResponse()
    const next = createMockNext()

    requireCatalogWrite(
      createMockRequest({ auth: authContext(['catalog:read']) }),
      asResponse(res),
      next
    )

    expect(res.sentStatus).toBe(403)
    expect(res.sentBody).toEqual({ error: 'Forbidden' })
    expect(next).not.toHaveBeenCalled()
  })

  it('responds 403 when the caller holds no permissions at all', () => {
    const res = createMockResponse()
    const next = createMockNext()

    requireCatalogWrite(createMockRequest({ auth: authContext([]) }), asResponse(res), next)

    expect(res.sentStatus).toBe(403)
    expect(next).not.toHaveBeenCalled()
  })

  // Anonymous, or requireAuth missing from the chain: nothing was denied because
  // nobody was identified, so this is a 401 rather than a 403.
  it('responds 401 when req.auth was never populated', () => {
    const res = createMockResponse()
    const next = createMockNext()

    requireCatalogWrite(createMockRequest(), asResponse(res), next)

    expect(res.sentStatus).toBe(401)
    expect(res.sentBody).toEqual({ error: 'Unauthorized' })
    expect(next).not.toHaveBeenCalled()
  })

  it('matches permission names exactly, rejecting a prefix', () => {
    const res = createMockResponse()
    const next = createMockNext()

    requireCatalogWrite(
      createMockRequest({ auth: authContext(['catalog']) }),
      asResponse(res),
      next
    )

    expect(res.sentStatus).toBe(403)
    expect(next).not.toHaveBeenCalled()
  })

  it('guards each permission independently', () => {
    const res = createMockResponse()
    const next = createMockNext()

    requirePermission('reviews:moderate')(
      createMockRequest({ auth: authContext(['catalog:write']) }),
      asResponse(res),
      next
    )

    expect(res.sentStatus).toBe(403)
    expect(next).not.toHaveBeenCalled()
  })
})
