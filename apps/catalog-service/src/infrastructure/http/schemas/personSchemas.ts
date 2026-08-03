import { z } from 'zod'

import { nonEmptyString } from './commonSchemas'

export const createPersonSchema = z.object({
  name: nonEmptyString,
  biography: z.string().nullable().optional(),
  birthDate: z.coerce.date().nullable().optional(),
  profilePath: z.string().nullable().optional(),
})
