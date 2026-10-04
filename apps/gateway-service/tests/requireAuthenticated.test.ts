import type { AuthContext } from '@cinescope/shared/infrastructure/http'
import type { Request, Response } from 'express'

import { requireAuthenticated } from '@gateway/infrastructure/http/authorization/requireAuthenticated'

const caller: AuthContext = {
  userId: 'user-1',
  username: 'ripley',
  email: 'ripley@weyland.test',
  roles: ['user'],
  permissions: [],
}

const mockResponse = () => {
  const res = { status: jest.fn(), json: jest.fn() }
  res.status.mockReturnValue(res)
  return res
}

describe('requireAuthenticated', () => {
  it('responds 401 when req.auth is missing', () => {
    const res = mockResponse()
    const next = jest.fn()

    requireAuthenticated({} as Request, res as unknown as Response, next)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' })
    expect(next).not.toHaveBeenCalled()
  })

  it('calls next for an identified caller, whatever their permissions', () => {
    const res = mockResponse()
    const next = jest.fn()

    requireAuthenticated({ auth: caller } as Request, res as unknown as Response, next)

    expect(next).toHaveBeenCalledTimes(1)
    expect(next).toHaveBeenCalledWith()
    expect(res.status).not.toHaveBeenCalled()
  })
})
