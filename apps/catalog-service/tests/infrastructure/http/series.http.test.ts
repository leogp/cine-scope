import request from 'supertest'

import { authHeader } from '../../helpers/authToken'
import { buildTestApp, validGenreBody, validSeriesBody } from '../../helpers/buildTestApp'

const readOnly = () => authHeader({ roles: ['user'], permissions: ['catalog:read'] })

describe('POST /series', () => {
  it('responds 201 with the new id and persists the series', async () => {
    const { app, seriesRepository } = buildTestApp()

    const response = await request(app)
      .post('/series')
      .set('Authorization', authHeader())
      .send(validSeriesBody)

    expect(response.status).toBe(201)
    expect(response.body).toEqual({ id: expect.any(String) })
    expect(seriesRepository.size).toBe(1)
  })

  it('coerces air dates from the ISO strings JSON carries', async () => {
    const { app } = buildTestApp()

    const created = await request(app)
      .post('/series')
      .set('Authorization', authHeader())
      .send({ ...validSeriesBody, firstAirDate: '2016-07-21' })

    const response = await request(app).get(`/series/${created.body.id}`)

    expect(response.status).toBe(200)
    expect(response.body.firstAirDate).toBe('2016-07-21T00:00:00.000Z')
  })

  it('responds 400 for a body that misses the schema', async () => {
    const { app, seriesRepository } = buildTestApp()

    const response = await request(app)
      .post('/series')
      .set('Authorization', authHeader())
      .send({ ...validSeriesBody, title: '' })

    expect(response.status).toBe(400)
    expect(response.body.error).toBe('ValidationError')
    expect(seriesRepository.size).toBe(0)
  })

  it('responds 404 when a referenced person does not exist', async () => {
    const { app } = buildTestApp()

    const response = await request(app)
      .post('/series')
      .set('Authorization', authHeader())
      .send({ ...validSeriesBody, castIds: ['missing-person'] })

    expect(response.status).toBe(404)
    expect(response.body.error).toBe('PersonNotFoundError')
  })

  it('resolves relation ids into the aggregate', async () => {
    const { app } = buildTestApp()
    const genre = await request(app)
      .post('/genres')
      .set('Authorization', authHeader())
      .send(validGenreBody)

    const created = await request(app)
      .post('/series')
      .set('Authorization', authHeader())
      .send({ ...validSeriesBody, genreIds: [genre.body.id] })

    const response = await request(app).get(`/series/${created.body.id}`)

    expect(response.body.genres).toEqual([{ id: genre.body.id, name: 'Drama' }])
  })
})

describe('GET /series', () => {
  it('responds 200 with a paginated envelope, anonymously', async () => {
    const { app } = buildTestApp()
    await request(app).post('/series').set('Authorization', authHeader()).send(validSeriesBody)

    const response = await request(app).get('/series')

    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({
      items: [expect.objectContaining({ title: 'Fleabag' })],
      total: 1,
      page: 1,
    })
    expect(response.body.items[0]).not.toHaveProperty('genres')
  })

  it('honours page and pageSize query params', async () => {
    const { app } = buildTestApp()
    await request(app)
      .post('/series')
      .set('Authorization', authHeader())
      .send({ ...validSeriesBody, title: 'First' })
    await request(app)
      .post('/series')
      .set('Authorization', authHeader())
      .send({ ...validSeriesBody, title: 'Second' })

    const response = await request(app).get('/series').query({ page: 2, pageSize: 1 })

    expect(response.status).toBe(200)
    expect(response.body.items).toHaveLength(1)
    expect(response.body).toMatchObject({ total: 2, page: 2, pageSize: 1 })
  })

  it('responds 400 for a non-numeric page', async () => {
    const { app } = buildTestApp()

    const response = await request(app).get('/series').query({ page: 'abc' })

    expect(response.status).toBe(400)
    expect(response.body.error).toBe('ValidationError')
  })
})

describe('GET /series/:id', () => {
  it('responds 200 with the full series read model', async () => {
    const { app } = buildTestApp()
    const created = await request(app)
      .post('/series')
      .set('Authorization', authHeader())
      .send(validSeriesBody)

    const response = await request(app).get(`/series/${created.body.id}`)

    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({
      id: created.body.id,
      title: 'Fleabag',
      originalLanguage: 'en',
      genres: [],
      cast: [],
      directors: [],
      productionCompanies: [],
    })
  })

  it('responds 404 for an unknown id', async () => {
    const { app } = buildTestApp()

    const response = await request(app).get('/series/does-not-exist')

    expect(response.status).toBe(404)
    expect(response.body.error).toBe('SeriesNotFoundError')
  })
})

describe('PUT /series/:id', () => {
  it('responds 200 and replaces the series', async () => {
    const { app } = buildTestApp()
    const created = await request(app)
      .post('/series')
      .set('Authorization', authHeader())
      .send(validSeriesBody)

    const response = await request(app)
      .put(`/series/${created.body.id}`)
      .set('Authorization', authHeader())
      .send({ ...validSeriesBody, title: 'Succession', firstAirDate: '2018-06-03' })

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ id: created.body.id })

    const updated = await request(app).get(`/series/${created.body.id}`)
    expect(updated.body).toMatchObject({
      title: 'Succession',
      firstAirDate: '2018-06-03T00:00:00.000Z',
    })
  })

  it('responds 404 for an unknown id', async () => {
    const { app } = buildTestApp()

    const response = await request(app)
      .put('/series/does-not-exist')
      .set('Authorization', authHeader())
      .send(validSeriesBody)

    expect(response.status).toBe(404)
    expect(response.body.error).toBe('SeriesNotFoundError')
  })

  it('responds 400 for a body that misses the schema', async () => {
    const { app } = buildTestApp()
    const created = await request(app)
      .post('/series')
      .set('Authorization', authHeader())
      .send(validSeriesBody)

    const response = await request(app)
      .put(`/series/${created.body.id}`)
      .set('Authorization', authHeader())
      .send({ title: 'Partial' })

    expect(response.status).toBe(400)
    expect(response.body.error).toBe('ValidationError')
  })

  // An empty body on purpose: the guards run before validation, so the caller
  // learns nothing about the schema.
  it('responds 401 without a token, before validating the body', async () => {
    const { app } = buildTestApp()
    const created = await request(app)
      .post('/series')
      .set('Authorization', authHeader())
      .send(validSeriesBody)

    const response = await request(app).put(`/series/${created.body.id}`).send({})

    expect(response.status).toBe(401)
    expect(response.body).toEqual({ error: 'Unauthorized' })
  })

  it('responds 403 without catalog:write and leaves the series unchanged', async () => {
    const { app } = buildTestApp()
    const created = await request(app)
      .post('/series')
      .set('Authorization', authHeader())
      .send(validSeriesBody)

    const response = await request(app)
      .put(`/series/${created.body.id}`)
      .set('Authorization', readOnly())
      .send({ ...validSeriesBody, title: 'Succession' })

    expect(response.status).toBe(403)
    expect(response.body).toEqual({ error: 'Forbidden' })

    const unchanged = await request(app).get(`/series/${created.body.id}`)
    expect(unchanged.body.title).toBe('Fleabag')
  })
})
