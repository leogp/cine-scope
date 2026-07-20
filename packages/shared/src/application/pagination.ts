export const DEFAULT_PAGE_SIZE = 20
export const MAX_PAGE_SIZE = 100

export interface PaginationParams {
  page: number
  pageSize: number
}

export interface PaginatedResult<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

function toPositiveInt(value: number | undefined, fallback: number): number {
  if (value === undefined || !Number.isFinite(value)) {
    return fallback
  }

  return Math.max(Math.trunc(value), 1)
}

/**
 * Clamps raw values (e.g. parsed from a query string, where NaN or negatives
 * can appear) into safe pagination params.
 */
export function normalizePagination(params?: Partial<PaginationParams>): PaginationParams {
  return {
    page: toPositiveInt(params?.page, 1),
    pageSize: Math.min(toPositiveInt(params?.pageSize, DEFAULT_PAGE_SIZE), MAX_PAGE_SIZE),
  }
}

export function buildPaginatedResult<T>(
  items: T[],
  total: number,
  params: PaginationParams
): PaginatedResult<T> {
  return {
    items,
    total,
    page: params.page,
    pageSize: params.pageSize,
    totalPages: Math.ceil(total / params.pageSize),
  }
}
