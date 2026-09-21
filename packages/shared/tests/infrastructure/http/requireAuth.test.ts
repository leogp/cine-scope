import jwt from 'jsonwebtoken'

import { buildRequireAuth } from '../../../src/infrastructure/http/requireAuth'
import { asResponse, createMockNext, createMockRequest, createMockResponse } from './httpMocks'

const SECRET = 'shared-test-secret-0123456789'
const ISSUER = 'auth-service'

const requireAuth = buildRequireAuth({ secret: SECRET, issuer: ISSUER })

const sign = (
  payload: Record<string, unknown>,
  options: jwt.SignOptions = {},
  secret: string = SECRET
): string => jwt.sign(payload, secret, { issuer: ISSUER, expiresIn: '15m', ...options })

const requestWith = (token: string) =>
  createMockRequest({ headers: { authorization: `Bearer ${token}` } })

const validClaims = {
  sub: 'user-1',
  username: 'ripley',
  email: 'ripley@weyland.test',
  roles: ['editor'],
  permissions: ['catalog:write'],
}

describe('buildRequireAuth', () => {
  it('populates req.auth from a valid token and continues', () => {
    const req = requestWith(sign(validClaims))
    const res = createMockResponse()
    const next = createMockNext()

    requireAuth(req, asResponse(res), next)

    expect(next).toHaveBeenCalledTimes(1)
    expect(res.sentStatus).toBeUndefined()
    expect(req.auth).toEqual({
      userId: 'user-1',
      username: 'ripley',
      email: 'ripley@weyland.test',
      roles: ['editor'],
      permissions: ['catalog:write'],
    })
  })

  it.each([
    ['no Authorization header', createMockRequest()],
    ['an empty Authorization header', createMockRequest({ headers: { authorization: '' } })],
    ['a non-Bearer scheme', createMockRequest({ headers: { authorization: 'Basic abc' } })],
    ['a bare token with no scheme', createMockRequest({ headers: { authorization: 'abc.def' } })],
  ])('responds 401 for %s', (_case, req) => {
    const res = createMockResponse()
    const next = createMockNext()

    requireAuth(req, asResponse(res), next)

    expect(res.sentStatus).toBe(401)
    expect(res.sentBody).toEqual({ error: 'Unauthorized' })
    expect(next).not.toHaveBeenCalled()
  })

  it('responds 401 for a token that is not a JWT at all', () => {
    const res = createMockResponse()
    const next = createMockNext()

    requireAuth(requestWith('not-a-jwt'), asResponse(res), next)

    expect(res.sentStatus).toBe(401)
    expect(next).not.toHaveBeenCalled()
  })

  it('responds 401 for an expired token', () => {
    const res = createMockResponse()
    const next = createMockNext()

    requireAuth(requestWith(sign(validClaims, { expiresIn: '-1s' })), asResponse(res), next)

    expect(res.sentStatus).toBe(401)
    expect(next).not.toHaveBeenCalled()
  })

  it('responds 401 for a token signed with a different secret', () => {
    const res = createMockResponse()
    const next = createMockNext()

    requireAuth(
      requestWith(sign(validClaims, {}, 'a-different-secret-0123456789')),
      asResponse(res),
      next
    )

    expect(res.sentStatus).toBe(401)
    expect(next).not.toHaveBeenCalled()
  })

  it('responds 401 for a token from another issuer', () => {
    const res = createMockResponse()
    const next = createMockNext()

    requireAuth(requestWith(sign(validClaims, { issuer: 'someone-else' })), asResponse(res), next)

    expect(res.sentStatus).toBe(401)
    expect(next).not.toHaveBeenCalled()
  })

  it('responds 401 when the token carries no subject', () => {
    const { username, email, roles, permissions } = validClaims
    const res = createMockResponse()
    const next = createMockNext()

    requireAuth(requestWith(sign({ username, email, roles, permissions })), asResponse(res), next)

    expect(res.sentStatus).toBe(401)
    expect(next).not.toHaveBeenCalled()
  })

  // A token is attacker-supplied data: a malformed claim must narrow the caller's
  // rights, never widen them or crash the middleware.
  it('treats a non-array permissions claim as no permissions', () => {
    const req = requestWith(sign({ ...validClaims, permissions: 'catalog:write' }))
    const res = createMockResponse()
    const next = createMockNext()

    requireAuth(req, asResponse(res), next)

    expect(next).toHaveBeenCalledTimes(1)
    expect(req.auth?.permissions).toEqual([])
  })

  it('drops non-string entries from the roles and permissions claims', () => {
    const req = requestWith(sign({ ...validClaims, roles: ['editor', 7], permissions: [null] }))
    const res = createMockResponse()
    const next = createMockNext()

    requireAuth(req, asResponse(res), next)

    expect(req.auth?.roles).toEqual(['editor'])
    expect(req.auth?.permissions).toEqual([])
  })

  it('defaults missing username and email claims to empty strings', () => {
    const req = requestWith(sign({ sub: 'user-2' }))
    const res = createMockResponse()
    const next = createMockNext()

    requireAuth(req, asResponse(res), next)

    expect(req.auth).toEqual({
      userId: 'user-2',
      username: '',
      email: '',
      roles: [],
      permissions: [],
    })
  })

  it('accepts any issuer when none is configured', () => {
    const permissive = buildRequireAuth({ secret: SECRET })
    const req = requestWith(sign(validClaims, { issuer: 'gateway-service' }))
    const res = createMockResponse()
    const next = createMockNext()

    permissive(req, asResponse(res), next)

    expect(next).toHaveBeenCalledTimes(1)
    expect(req.auth?.userId).toBe('user-1')
  })
})
