import { z } from 'zod'

import { nonEmptyString } from './commonSchemas'

export const createMovieSchema = z.object({
  title: nonEmptyString,
  overview: z.string().nullable(),
  releaseDate: z.coerce.date().nullable(),
  duration: z.number().nullable(),
  originalLanguage: nonEmptyString,
  posterPath: z.string().nullable(),
  backdropPath: z.string().nullable(),
  genreIds: z.array(nonEmptyString),
  castIds: z.array(nonEmptyString),
  directorIds: z.array(nonEmptyString),
  companyIds: z.array(nonEmptyString),
})

// Full-replace (PUT) semantics: same body as create; the target id comes from the path
export const updateMovieSchema = createMovieSchema
