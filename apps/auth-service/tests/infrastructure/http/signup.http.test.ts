import request from 'supertest'

import { buildTestApp, validSignUpBody } from '../../helpers/buildTestApp'

describe('POST /auth/signup', () => {
  it('creates the user and responds 201 with its id', async () => {
    const { app } = buildTestApp()

    const response = await request(app).post('/auth/signup').send(validSignUpBody)

    expect(response.status).toBe(201)
    expect(response.body).toEqual({ id: expect.any(String) })
  })

  it('responds 409 for a duplicate email', async () => {
    const { app } = buildTestApp()
    await request(app).post('/auth/signup').send(validSignUpBody)

    const response = await request(app)
      .post('/auth/signup')
      .send({ ...validSignUpBody, username: 'other_user' })

    expect(response.status).toBe(409)
    expect(response.body).toEqual({
      error: 'EmailAlreadyExistsError',
      message: expect.any(String),
    })
  })

  it('responds 409 for a duplicate username', async () => {
    const { app } = buildTestApp()
    await request(app).post('/auth/signup').send(validSignUpBody)

    const response = await request(app)
      .post('/auth/signup')
      .send({ ...validSignUpBody, email: 'other@example.com' })

    expect(response.status).toBe(409)
    expect(response.body.error).toBe('UsernameAlreadyExistsError')
  })

  it('responds 400 when the password violates the policy', async () => {
    const { app } = buildTestApp()

    const response = await request(app)
      .post('/auth/signup')
      .send({ ...validSignUpBody, password: 'weak' })

    expect(response.status).toBe(400)
    expect(response.body.error).toBe('InvalidPasswordError')
  })

  it('responds 400 with validation details when a field is missing', async () => {
    const { app } = buildTestApp()

    const response = await request(app)
      .post('/auth/signup')
      .send({ email: 'leo@example.com', password: 'Str0ng!Pass' })

    expect(response.status).toBe(400)
    expect(response.body.error).toBe('ValidationError')
    expect(response.body.details).toBeDefined()
  })
})
