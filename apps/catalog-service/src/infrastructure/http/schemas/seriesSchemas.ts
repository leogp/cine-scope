import { z } from 'zod'

import { nonEmptyString } from './commonSchemas'

export const createSeriesSchema = z.object({
  title: nonEmptyString,
  overview: z.string().nullable(),
  firstAirDate: z.coerce.date().nullable(),
  lastAirDate: z.coerce.date().nullable(),
  originalLanguage: nonEmptyString,
  posterPath: z.string().nullable(),
  backdropPath: z.string().nullable(),
  genreIds: z.array(nonEmptyString),
  castIds: z.array(nonEmptyString),
  directorIds: z.array(nonEmptyString),
  companyIds: z.array(nonEmptyString),
})
