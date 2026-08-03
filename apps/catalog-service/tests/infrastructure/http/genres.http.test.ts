import request from 'supertest'

import { buildTestApp, validGenreBody } from '../../helpers/buildTestApp'

describe('POST /genres', () => {
  it('responds 201 with the new id and persists the genre', async () => {
    const { app, genreRepository } = buildTestApp()

    const response = await request(app).post('/genres').send(validGenreBody)

    expect(response.status).toBe(201)
    expect(response.body).toEqual({ id: expect.any(String) })
    expect(genreRepository.size).toBe(1)
  })

  // Genre names carry a unique constraint, so a repeat is a conflict rather
  // than an invariant violation — 409, not the DomainError default of 400.
  it('responds 409 for a duplicate name', async () => {
    const { app, genreRepository } = buildTestApp()
    await request(app).post('/genres').send(validGenreBody)

    const response = await request(app).post('/genres').send(validGenreBody)

    expect(response.status).toBe(409)
    expect(response.body.error).toBe('GenreAlreadyExistsError')
    expect(genreRepository.size).toBe(1)
  })

  it('responds 400 for an empty name', async () => {
    const { app } = buildTestApp()

    const response = await request(app).post('/genres').send({ name: '' })

    expect(response.status).toBe(400)
    expect(response.body.error).toBe('ValidationError')
  })

  // A whitespace-only name clears the schema's `min(1)` but not GenreName's
  // trim check — the DomainError has to surface as a 400 too.
  it('responds 400 when the value object rejects a schema-valid name', async () => {
    const { app } = buildTestApp()

    const response = await request(app).post('/genres').send({ name: '   ' })

    expect(response.status).toBe(400)
    expect(response.body.error).toBe('InvalidGenreNameError')
  })
})

describe('GET /genres/:id', () => {
  it('responds 200 with the genre', async () => {
    const { app } = buildTestApp()
    const created = await request(app).post('/genres').send(validGenreBody)

    const response = await request(app).get(`/genres/${created.body.id}`)

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      id: created.body.id,
      name: 'Drama',
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    })
  })

  it('responds 404 for an unknown id', async () => {
    const { app } = buildTestApp()

    const response = await request(app).get('/genres/does-not-exist')

    expect(response.status).toBe(404)
    expect(response.body.error).toBe('GenreNotFoundError')
  })
})
