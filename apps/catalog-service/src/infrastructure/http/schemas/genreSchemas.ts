import { z } from 'zod'

import { nonEmptyString } from './commonSchemas'

export const createGenreSchema = z.object({
  name: nonEmptyString,
})
