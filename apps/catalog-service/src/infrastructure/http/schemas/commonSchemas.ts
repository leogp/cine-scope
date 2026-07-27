import { z } from 'zod'

// HTTP-shape validation only — domain value objects (MovieTitle, Duration, ...)
// remain the authority on business rules
export const nonEmptyString = z.string().min(1)

export const idParamsSchema = z.object({
  id: nonEmptyString,
})

// normalizePagination owns defaults and clamping; the schema only coerces shape
export const paginationQuerySchema = z.object({
  page: z.coerce.number().optional(),
  pageSize: z.coerce.number().optional(),
})
