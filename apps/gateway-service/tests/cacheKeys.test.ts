import type { Request } from 'express'

import {
  CACHEABLE_ROUTES,
  type CacheableRoute,
} from '@gateway/infrastructure/http/cache/cacheableRoutes'
import { cacheKeys, resourceOf } from '@gateway/infrastructure/http/cache/cacheKeys'

const routeAt = (path: string): CacheableRoute => {
  const route = CACHEABLE_ROUTES.find((entry) => entry.path === path)
  if (!route) throw new Error(`no cacheable route at ${path}`)
  return route
}

const requestWith = (fields: {
  params?: Record<string, string>
  query?: Record<string, unknown>
}): Request => ({ params: {}, query: {}, ...fields }) as unknown as Request

describe('cache keys', () => {
  const list = routeAt('/movies')
  const detail = routeAt('/movies/:id')

  it('composes the entry key from prefix, format, collection, generation and resource', () => {
    const keys = cacheKeys('cache:')

    expect(keys.entry('movies', 3, 'GET:/catalog/movies?page=2')).toBe(
      'cache:v1:movies:3:GET:/catalog/movies?page=2'
    )
    expect(keys.generation('movies')).toBe('cache:gen:movies')
  })

  it('sorts the accepted parameters by name', () => {
    const req = requestWith({ query: { pageSize: '10', page: '2' } })

    expect(resourceOf(list, req)).toBe('GET:/catalog/movies?page=2&pageSize=10')
  })

  it('drops parameters the route does not accept', () => {
    expect(resourceOf(list, requestWith({ query: { page: '2', sort: 'title' } }))).toBe(
      'GET:/catalog/movies?page=2'
    )
    expect(resourceOf(detail, requestWith({ params: { id: '42' }, query: { page: '2' } }))).toBe(
      'GET:/catalog/movies/42'
    )
  })

  it.each(['2', '02', '2.0', ' 2 '])('keys page=%p as catalog coerces it', (page) => {
    expect(resourceOf(list, requestWith({ query: { page } }))).toBe('GET:/catalog/movies?page=2')
  })

  it.each<[string, unknown]>([
    ['repeated', ['1', '2']],
    ['nested', { x: '1' }],
    ['non-numeric', 'two'],
    ['infinite', 'Infinity'],
  ])('refuses to key a %s parameter', (_kind, page) => {
    expect(resourceOf(list, requestWith({ query: { page } }))).toBeUndefined()
  })

  it('rebuilds the path from the table, percent-encoding parameter values', () => {
    expect(resourceOf(detail, requestWith({ params: { id: 'a/b c' } }))).toBe(
      'GET:/catalog/movies/a%2Fb%20c'
    )
  })
})
