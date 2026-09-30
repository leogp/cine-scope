import request from 'supertest'

import { buildApp } from '@gateway/infrastructure/http/app'
import { startStubService, type StubService } from './helpers/startStubService'

describe('gateway proxy', () => {
  let catalog: StubService
  let app: ReturnType<typeof buildApp>

  beforeEach(async () => {
    catalog = await startStubService('catalog-service')
    app = buildApp({
      routes: [{ prefix: '/catalog', target: catalog.url }],
      proxyTimeoutMs: 2_000,
    })
  })

  afterEach(async () => {
    await catalog.close()
  })

  it('strips the mount prefix and preserves the query string', async () => {
    await request(app).get('/catalog/movies?page=2').expect(200)

    expect(catalog.received[0].url).toBe('/movies?page=2')
  })

  it('forwards the bare prefix as /', async () => {
    await request(app).get('/catalog').expect(200)

    expect(catalog.received[0].url).toBe('/')
  })

  it('rewrites Host to the target (changeOrigin)', async () => {
    await request(app).get('/catalog/movies').expect(200)

    expect(catalog.received[0].headers.host).toBe(new URL(catalog.url).host)
  })

  it('adds the forwarding headers (xfwd)', async () => {
    await request(app).get('/catalog/movies').expect(200)

    const { headers } = catalog.received[0]
    expect(headers['x-forwarded-proto']).toBe('http')
    expect(headers['x-forwarded-for']).toBeDefined()
    expect(headers['x-forwarded-host']).toBeDefined()
  })

  it('discards a client-supplied X-Forwarded-For instead of appending to it', async () => {
    await request(app).get('/catalog/movies').set('X-Forwarded-For', '10.0.0.1').expect(200)

    expect(catalog.received[0].headers['x-forwarded-for']).not.toContain('10.0.0.1')
  })

  it('forwards a JSON body unparsed', async () => {
    const body = { title: 'Heat', year: 1995 }

    await request(app).post('/catalog/movies').send(body).expect(200)

    expect(catalog.received[0].method).toBe('POST')
    expect(JSON.parse(catalog.received[0].body)).toEqual(body)
  })

  it('forwards a large non-JSON body byte for byte', async () => {
    const payload = 'x'.repeat(100_000)

    await request(app)
      .post('/catalog/import')
      .set('Content-Type', 'text/plain')
      .send(payload)
      .expect(200)

    expect(catalog.received[0].body).toBe(payload)
  })

  it('answers 502 in the shared envelope when the service is unreachable', async () => {
    await catalog.close()

    const response = await request(app).get('/catalog/movies').expect(502)

    expect(response.body.error).toBe('BadGateway')
  })

  it('404s on prefixes it does not serve, including near-misses', async () => {
    await request(app).get('/engagement/feed').expect(404)
    await request(app).get('/catalogue').expect(404)
    await request(app).get('/').expect(404)

    expect(catalog.received).toHaveLength(0)
  })

  it('serves its own health without any downstream service', async () => {
    await catalog.close()

    const response = await request(app).get('/health').expect(200)

    expect(response.body).toEqual({ status: 'ok', service: 'gateway-service' })
  })
})
