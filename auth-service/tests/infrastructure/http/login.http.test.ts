import request from 'supertest'

import { buildTestApp, validSignUpBody } from '../../helpers/buildTestApp'

describe('POST /auth/login', () => {
  const loginBody = { email: validSignUpBody.email, password: validSignUpBody.password }

  it('responds 200 with a token pair for valid credentials', async () => {
    const { app } = buildTestApp()
    await request(app).post('/auth/signup').send(validSignUpBody)

    const response = await request(app).post('/auth/login').send(loginBody)

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      accessToken: expect.any(String),
      refreshToken: expect.any(String),
    })
  })

  it('responds 401 for a wrong password', async () => {
    const { app } = buildTestApp()
    await request(app).post('/auth/signup').send(validSignUpBody)

    const response = await request(app)
      .post('/auth/login')
      .send({ ...loginBody, password: 'Wr0ng!Pass' })

    expect(response.status).toBe(401)
    expect(response.body.error).toBe('InvalidCredentialsError')
  })

  // Current errorHandler mapping: UserNotFoundError → 404. It leaks account
  // existence (user enumeration); tightening it to 401 is a known follow-up.
  it('responds 404 for an unknown email', async () => {
    const { app } = buildTestApp()

    const response = await request(app).post('/auth/login').send(loginBody)

    expect(response.status).toBe(404)
    expect(response.body.error).toBe('UserNotFoundError')
  })

  it('responds 400 when the email is malformed', async () => {
    const { app } = buildTestApp()

    const response = await request(app)
      .post('/auth/login')
      .send({ ...loginBody, email: 'not-an-email' })

    expect(response.status).toBe(400)
    expect(response.body.error).toBe('InvalidEmailError')
  })
})
