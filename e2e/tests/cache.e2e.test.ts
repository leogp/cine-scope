import { movieBody } from '../support/catalog'
import { eventually } from '../support/eventually'
import { readFixtures, uniqueName } from '../support/fixtures'
import { api, createResource, isRecord, type ApiResponse } from '../support/http'

const { runId, seeded, catalog } = readFixtures()

const xCache = (response: ApiResponse): string | null => response.headers.get('x-cache')
const isHit = (response: ApiResponse): boolean => xCache(response) === 'HIT'

function itemCount(response: ApiResponse): number {
  const items = isRecord(response.body) ? response.body.items : undefined
  if (response.status !== 200 || !Array.isArray(items)) {
    throw new Error(
      `Expected a 200 page of items, got HTTP ${response.status} ${JSON.stringify(response.body)}`
    )
  }
  return items.length
}

/**
 * One row per entry of CACHEABLE_ROUTES
 * (apps/gateway-service/src/infrastructure/http/cache/cacheableRoutes.ts), in
 * its order. Enumerated rather than derived: the table is gateway source, and
 * importing or parsing it would tie this black-box suite to the gateway's
 * checkout instead of its URL. A route added to the table needs a row here.
 */
const CACHEABLE_ROUTES = [
  { route: '/movies', path: '/catalog/movies', expected: { items: expect.any(Array) } },
  {
    route: '/movies/:id',
    path: `/catalog/movies/${catalog.movieIds[0]}`,
    expected: { id: catalog.movieIds[0] },
  },
  {
    route: '/series/:id',
    path: `/catalog/series/${catalog.seriesId}`,
    expected: { id: catalog.seriesId },
  },
  {
    route: '/genres/:id',
    path: `/catalog/genres/${catalog.genreId}`,
    expected: { id: catalog.genreId },
  },
  {
    route: '/companies/:id',
    path: `/catalog/companies/${catalog.companyId}`,
    expected: { id: catalog.companyId },
  },
  {
    route: '/people/:id',
    path: `/catalog/people/${catalog.personId}`,
    expected: { id: catalog.personId },
  },
]

describe('response cache', () => {
  it('misses, hits, then misses with the new title after a PUT through the gateway', async () => {
    // A movie of its own, never read before: the first GET misses whatever ran earlier.
    const title = uniqueName(runId, 'cached')
    const id = await createResource('/catalog/movies', seeded.accessToken, movieBody(title))
    const path = `/catalog/movies/${id}`

    const miss = await api(path)
    expect(miss.status).toBe(200)
    expect(xCache(miss)).toBe('MISS')
    expect(miss.body).toMatchObject({ id, title })

    const hit = await eventually(() => api(path), isHit, `GET ${path} to be served from cache`)
    expect(hit.body).toEqual(miss.body)

    const newTitle = uniqueName(runId, 'updated')
    const put = await api(path, {
      method: 'PUT',
      token: seeded.accessToken,
      body: movieBody(newTitle),
    })
    expect(put.status).toBe(200)

    const fresh = await eventually(
      () => api(path),
      (response) => isRecord(response.body) && response.body.title === newTitle,
      `GET ${path} to return the new title`
    )
    expect(xCache(fresh)).toBe('MISS')
  })

  // A pageSize the table no longer lists (renamed on either side) is dropped
  // from the key, so the second request would be answered from the first's entry.
  it('keys the movie list by pageSize', async () => {
    // Stored first, so a key that ignored pageSize would serve it to the next request.
    const one = await eventually(
      () => api('/catalog/movies?pageSize=1'),
      isHit,
      'GET /catalog/movies?pageSize=1 to be served from cache'
    )
    const two = await api('/catalog/movies?pageSize=2')

    expect(itemCount(one)).toBe(1)
    // The setup created two movies, so a page of two always exists.
    expect(itemCount(two)).toBe(2)
  })

  // X-Cache is set only on a path the gateway's table matched: present with a
  // 200 and the right resource, the table and catalog agree on the path.
  it.each(CACHEABLE_ROUTES)(
    'serves $route through the cache from catalog',
    async ({ path, expected }) => {
      const response = await api(path)

      expect(response.status).toBe(200)
      expect(xCache(response)).toMatch(/^(HIT|MISS)$/)
      expect(response.body).toMatchObject(expected)
    }
  )
})
