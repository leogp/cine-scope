import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  buildPaginatedResult,
  normalizePagination,
} from '../../src/application/pagination'

describe('normalizePagination', () => {
  it('applies defaults when no params are given', () => {
    expect(normalizePagination()).toEqual({ page: 1, pageSize: DEFAULT_PAGE_SIZE })
  })

  it('keeps valid params as-is', () => {
    expect(normalizePagination({ page: 3, pageSize: 50 })).toEqual({ page: 3, pageSize: 50 })
  })

  it('clamps pageSize to the maximum', () => {
    expect(normalizePagination({ pageSize: 5000 }).pageSize).toBe(MAX_PAGE_SIZE)
  })

  it('clamps zero and negative values to 1', () => {
    expect(normalizePagination({ page: 0, pageSize: -5 })).toEqual({ page: 1, pageSize: 1 })
  })

  it('falls back to defaults on NaN (e.g. a non-numeric query param)', () => {
    expect(normalizePagination({ page: Number('abc'), pageSize: Number('xyz') })).toEqual({
      page: 1,
      pageSize: DEFAULT_PAGE_SIZE,
    })
  })

  it('truncates fractional values', () => {
    expect(normalizePagination({ page: 2.9, pageSize: 10.4 })).toEqual({ page: 2, pageSize: 10 })
  })
})

describe('buildPaginatedResult', () => {
  it('computes totalPages from total and pageSize', () => {
    const result = buildPaginatedResult(['a', 'b'], 42, { page: 1, pageSize: 20 })

    expect(result).toEqual({
      items: ['a', 'b'],
      total: 42,
      page: 1,
      pageSize: 20,
      totalPages: 3,
    })
  })

  it('returns zero totalPages for an empty collection', () => {
    expect(buildPaginatedResult([], 0, { page: 1, pageSize: 20 }).totalPages).toBe(0)
  })
})
