import request from 'supertest'

import { buildTestApp, validGenreBody, validSeriesBody } from '../../helpers/buildTestApp'

describe('POST /series', () => {
  it('responds 201 with the new id and persists the series', async () => {
    const { app, seriesRepository } = buildTestApp()

    const response = await request(app).post('/series').send(validSeriesBody)

    expect(response.status).toBe(201)
    expect(response.body).toEqual({ id: expect.any(String) })
    expect(seriesRepository.size).toBe(1)
  })

  it('coerces air dates from the ISO strings JSON carries', async () => {
    const { app } = buildTestApp()

    const created = await request(app)
      .post('/series')
      .send({ ...validSeriesBody, firstAirDate: '2016-07-21' })

    const response = await request(app).get(`/series/${created.body.id}`)

    expect(response.status).toBe(200)
    expect(response.body.firstAirDate).toBe('2016-07-21T00:00:00.000Z')
  })

  it('responds 400 for a body that misses the schema', async () => {
    const { app, seriesRepository } = buildTestApp()

    const response = await request(app)
      .post('/series')
      .send({ ...validSeriesBody, title: '' })

    expect(response.status).toBe(400)
    expect(response.body.error).toBe('ValidationError')
    expect(seriesRepository.size).toBe(0)
  })

  it('responds 404 when a referenced person does not exist', async () => {
    const { app } = buildTestApp()

    const response = await request(app)
      .post('/series')
      .send({ ...validSeriesBody, castIds: ['missing-person'] })

    expect(response.status).toBe(404)
    expect(response.body.error).toBe('PersonNotFoundError')
  })

  it('resolves relation ids into the aggregate', async () => {
    const { app } = buildTestApp()
    const genre = await request(app).post('/genres').send(validGenreBody)

    const created = await request(app)
      .post('/series')
      .send({ ...validSeriesBody, genreIds: [genre.body.id] })

    const response = await request(app).get(`/series/${created.body.id}`)

    expect(response.body.genres).toEqual([{ id: genre.body.id, name: 'Drama' }])
  })
})

describe('GET /series/:id', () => {
  it('responds 200 with the full series read model', async () => {
    const { app } = buildTestApp()
    const created = await request(app).post('/series').send(validSeriesBody)

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
