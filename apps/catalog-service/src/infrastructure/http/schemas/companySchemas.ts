import { z } from 'zod'

import { nonEmptyString } from './commonSchemas'

export const createCompanySchema = z.object({
  name: nonEmptyString,
  logoPath: z.string().nullable().optional(),
  countryCode: z.string().nullable().optional(),
})
