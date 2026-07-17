import { Application } from 'express'
import request from 'supertest'

import { buildTestApp, validSignUpBody } from '../../helpers/buildTestApp'

const signUpAndLogin = async (app: Application): Promise<string> => {
  await request(app).post('/auth/signup').send(validSignUpBody)

  const login = await request(app)
    .post('/auth/login')
    .send({ email: validSignUpBody.email, password: validSignUpBody.password })

  return login.body.refreshToken
}

describe('POST /auth/refresh', () => {
  it('rotates the token pair and rejects reuse of the old refresh token', async () => {
    const { app } = buildTestApp()
    const refreshToken = await signUpAndLogin(app)

    const refresh = await request(app).post('/auth/refresh').send({ refreshToken })

    expect(refresh.status).toBe(200)
    expect(refresh.body).toEqual({
      accessToken: expect.any(String),
      refreshToken: expect.any(String),
    })
    expect(refresh.body.refreshToken).not.toBe(refreshToken)

    const reuse = await request(app).post('/auth/refresh').send({ refreshToken })

    expect(reuse.status).toBe(401)
    expect(reuse.body.error).toBe('RefreshTokenRevokedError')
  })

  it('responds 401 for an unknown refresh token', async () => {
    const { app } = buildTestApp()

    const response = await request(app).post('/auth/refresh').send({ refreshToken: 'ghost-token' })

    expect(response.status).toBe(401)
    expect(response.body.error).toBe('InvalidRefreshTokenError')
  })
})

describe('POST /auth/logout', () => {
  it('revokes the refresh token and responds 204, idempotently', async () => {
    const { app } = buildTestApp()
    const refreshToken = await signUpAndLogin(app)

    const logout = await request(app).post('/auth/logout').send({ refreshToken })

    expect(logout.status).toBe(204)
    expect(logout.body).toEqual({})

    const again = await request(app).post('/auth/logout').send({ refreshToken })

    expect(again.status).toBe(204)

    const refresh = await request(app).post('/auth/refresh').send({ refreshToken })

    expect(refresh.status).toBe(401)
    expect(refresh.body.error).toBe('RefreshTokenRevokedError')
  })
})
