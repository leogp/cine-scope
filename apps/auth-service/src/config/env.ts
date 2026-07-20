import type { StringValue } from 'ms'
import { z } from 'zod'

// jsonwebtoken's SignOptions['expiresIn'] only accepts ms-style durations,
// so validate the format here and narrow the type at the source of truth.
const duration = (def: StringValue) =>
  z
    .string()
    .regex(/^\d+\s*(ms|s|m|h|d|w|y)?$/i, 'expected an ms-style duration like "15m"')
    .default(def)
    .transform((v) => v as StringValue)

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4001),
  DATABASE_URL: z.url(),
  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  JWT_ACCESS_EXPIRES_IN: duration('15m'),
  JWT_REFRESH_EXPIRES_IN: duration('30d'),
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
