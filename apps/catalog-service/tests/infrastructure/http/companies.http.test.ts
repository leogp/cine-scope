import request from 'supertest'

import { buildTestApp, validCompanyBody } from '../../helpers/buildTestApp'

describe('POST /companies', () => {
  it('responds 201 with the new id and persists the company', async () => {
    const { app, companyRepository } = buildTestApp()

    const response = await request(app).post('/companies').send(validCompanyBody)

    expect(response.status).toBe(201)
    expect(response.body).toEqual({ id: expect.any(String) })
    expect(companyRepository.size).toBe(1)
  })

  it('accepts a body that omits the optional fields', async () => {
    const { app } = buildTestApp()

    const response = await request(app).post('/companies').send({ name: 'Neon' })

    expect(response.status).toBe(201)
  })

  it('responds 400 for an empty name', async () => {
    const { app, companyRepository } = buildTestApp()

    const response = await request(app)
      .post('/companies')
      .send({ ...validCompanyBody, name: '' })

    expect(response.status).toBe(400)
    expect(response.body.error).toBe('ValidationError')
    expect(companyRepository.size).toBe(0)
  })

  it('responds 400 when the value object rejects a schema-valid country code', async () => {
    const { app } = buildTestApp()

    const response = await request(app)
      .post('/companies')
      .send({ ...validCompanyBody, countryCode: 'usa' })

    expect(response.status).toBe(400)
    expect(response.body.error).toBe('InvalidCountryCodeError')
  })
})

describe('GET /companies/:id', () => {
  it('responds 200 with the company', async () => {
    const { app } = buildTestApp()
    const created = await request(app).post('/companies').send(validCompanyBody)

    const response = await request(app).get(`/companies/${created.body.id}`)

    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({
      id: created.body.id,
      name: 'A24',
      logoPath: null,
      countryCode: 'US',
    })
  })

  it('responds 404 for an unknown id', async () => {
    const { app } = buildTestApp()

    const response = await request(app).get('/companies/does-not-exist')

    expect(response.status).toBe(404)
    expect(response.body.error).toBe('CompanyNotFoundError')
  })
})
