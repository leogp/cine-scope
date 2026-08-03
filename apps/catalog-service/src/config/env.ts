import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4002),
  DATABASE_URL: z.url(),
  REDIS_URL: z.url().optional(),
  RABBITMQ_URL: z.url().optional(),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error(`Invalid environment variables:\n${z.prettifyError(parsed.error)}`)
  process.exit(1)
}

export const env = Object.freeze(parsed.data)

export type Env = z.infer<typeof envSchema>
