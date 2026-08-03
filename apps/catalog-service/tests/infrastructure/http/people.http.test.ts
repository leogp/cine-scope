import request from 'supertest'

import { buildTestApp, validPersonBody } from '../../helpers/buildTestApp'

describe('POST /people', () => {
  it('responds 201 with the new id and persists the person', async () => {
    const { app, personRepository } = buildTestApp()

    const response = await request(app).post('/people').send(validPersonBody)

    expect(response.status).toBe(201)
    expect(response.body).toEqual({ id: expect.any(String) })
    expect(personRepository.size).toBe(1)
  })

  it('accepts a body that omits the optional fields', async () => {
    const { app } = buildTestApp()

    const response = await request(app).post('/people').send({ name: 'Saoirse Ronan' })

    expect(response.status).toBe(201)
  })

  it('coerces birthDate from the ISO string JSON carries', async () => {
    const { app } = buildTestApp()

    const created = await request(app)
      .post('/people')
      .send({ ...validPersonBody, birthDate: '1983-08-04' })

    const response = await request(app).get(`/people/${created.body.id}`)

    expect(response.body.birthDate).toBe('1983-08-04T00:00:00.000Z')
  })

  it('responds 400 for an empty name', async () => {
    const { app, personRepository } = buildTestApp()

    const response = await request(app)
      .post('/people')
      .send({ ...validPersonBody, name: '' })

    expect(response.status).toBe(400)
    expect(response.body.error).toBe('ValidationError')
    expect(personRepository.size).toBe(0)
  })
})

describe('GET /people/:id', () => {
  it('responds 200 with the person', async () => {
    const { app } = buildTestApp()
    const created = await request(app).post('/people').send(validPersonBody)

    const response = await request(app).get(`/people/${created.body.id}`)

    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({
      id: created.body.id,
      name: 'Greta Gerwig',
      biography: null,
      birthDate: null,
      profilePath: null,
    })
  })

  it('responds 404 for an unknown id', async () => {
    const { app } = buildTestApp()

    const response = await request(app).get('/people/does-not-exist')

    expect(response.status).toBe(404)
    expect(response.body.error).toBe('PersonNotFoundError')
  })
})
