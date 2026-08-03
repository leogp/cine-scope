import request from 'supertest'

import { buildTestApp, validGenreBody, validMovieBody } from '../../helpers/buildTestApp'

describe('POST /movies', () => {
  it('responds 201 with the new id and persists the movie', async () => {
    const { app, movieRepository } = buildTestApp()

    const response = await request(app).post('/movies').send(validMovieBody)

    expect(response.status).toBe(201)
    expect(response.body).toEqual({ id: expect.any(String) })
    expect(movieRepository.size).toBe(1)
  })

  it('resolves relation ids into the aggregate', async () => {
    const { app } = buildTestApp()
    const genre = await request(app).post('/genres').send(validGenreBody)

    const created = await request(app)
      .post('/movies')
      .send({ ...validMovieBody, genreIds: [genre.body.id] })

    const movie = await request(app).get(`/movies/${created.body.id}`)

    expect(movie.status).toBe(200)
    expect(movie.body.genres).toEqual([{ id: genre.body.id, name: 'Drama' }])
  })

  it('responds 400 with the failing field for a body that misses the schema', async () => {
    const { app, movieRepository } = buildTestApp()

    const response = await request(app)
      .post('/movies')
      .send({ ...validMovieBody, title: '' })

    expect(response.status).toBe(400)
    expect(response.body.error).toBe('ValidationError')
    expect(response.body.details).toEqual(
      expect.arrayContaining([expect.objectContaining({ path: ['title'] })])
    )
    expect(movieRepository.size).toBe(0)
  })

  // The schema only checks HTTP shape; the value object is the authority on
  // the business rule, and its DomainError has to surface as a 400 too.
  it('responds 400 when a value object rejects a schema-valid body', async () => {
    const { app } = buildTestApp()

    const response = await request(app)
      .post('/movies')
      .send({ ...validMovieBody, originalLanguage: 'english' })

    expect(response.status).toBe(400)
    expect(response.body.error).toBe('InvalidLanguageCodeError')
  })

  it('responds 404 when a referenced genre does not exist', async () => {
    const { app } = buildTestApp()

    const response = await request(app)
      .post('/movies')
      .send({ ...validMovieBody, genreIds: ['missing-genre'] })

    expect(response.status).toBe(404)
    expect(response.body.error).toBe('GenreNotFoundError')
  })
})

describe('GET /movies', () => {
  it('responds 200 with a paginated envelope', async () => {
    const { app } = buildTestApp()
    await request(app).post('/movies').send(validMovieBody)

    const response = await request(app).get('/movies')

    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({
      items: [expect.objectContaining({ title: 'Lady Bird' })],
      total: 1,
      page: 1,
    })
  })

  it('honours page and pageSize query params', async () => {
    const { app } = buildTestApp()
    await request(app)
      .post('/movies')
      .send({ ...validMovieBody, title: 'First' })
    await request(app)
      .post('/movies')
      .send({ ...validMovieBody, title: 'Second' })

    const response = await request(app).get('/movies').query({ page: 2, pageSize: 1 })

    expect(response.status).toBe(200)
    expect(response.body.items).toHaveLength(1)
    expect(response.body).toMatchObject({ total: 2, page: 2, pageSize: 1 })
  })

  it('responds 400 for a non-numeric page', async () => {
    const { app } = buildTestApp()

    const response = await request(app).get('/movies').query({ page: 'abc' })

    expect(response.status).toBe(400)
    expect(response.body.error).toBe('ValidationError')
  })
})

describe('GET /movies/:id', () => {
  it('responds 200 with the full movie read model', async () => {
    const { app } = buildTestApp()
    const created = await request(app).post('/movies').send(validMovieBody)

    const response = await request(app).get(`/movies/${created.body.id}`)

    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({
      id: created.body.id,
      title: 'Lady Bird',
      duration: 94,
      originalLanguage: 'en',
      genres: [],
      cast: [],
      directors: [],
      productionCompanies: [],
    })
  })

  it('responds 404 for an unknown id', async () => {
    const { app } = buildTestApp()

    const response = await request(app).get('/movies/does-not-exist')

    expect(response.status).toBe(404)
    expect(response.body.error).toBe('MovieNotFoundError')
  })
})

describe('PUT /movies/:id', () => {
  it('responds 200 and replaces the movie', async () => {
    const { app } = buildTestApp()
    const created = await request(app).post('/movies').send(validMovieBody)

    const response = await request(app)
      .put(`/movies/${created.body.id}`)
      .send({ ...validMovieBody, title: 'Little Women', duration: 135 })

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ id: created.body.id })

    const updated = await request(app).get(`/movies/${created.body.id}`)
    expect(updated.body).toMatchObject({ title: 'Little Women', duration: 135 })
  })

  it('responds 404 for an unknown id', async () => {
    const { app } = buildTestApp()

    const response = await request(app).put('/movies/does-not-exist').send(validMovieBody)

    expect(response.status).toBe(404)
    expect(response.body.error).toBe('MovieNotFoundError')
  })

  it('responds 400 for a body that misses the schema', async () => {
    const { app } = buildTestApp()
    const created = await request(app).post('/movies').send(validMovieBody)

    const response = await request(app).put(`/movies/${created.body.id}`).send({ title: 'Partial' })

    expect(response.status).toBe(400)
    expect(response.body.error).toBe('ValidationError')
  })
})

describe('DELETE /movies/:id', () => {
  it('responds 204 with no body and removes the movie', async () => {
    const { app, movieRepository } = buildTestApp()
    const created = await request(app).post('/movies').send(validMovieBody)

    const response = await request(app).delete(`/movies/${created.body.id}`)

    expect(response.status).toBe(204)
    expect(response.body).toEqual({})
    expect(movieRepository.size).toBe(0)
  })

  it('responds 404 for an unknown id', async () => {
    const { app } = buildTestApp()

    const response = await request(app).delete('/movies/does-not-exist')

    expect(response.status).toBe(404)
    expect(response.body.error).toBe('MovieNotFoundError')
  })
})
