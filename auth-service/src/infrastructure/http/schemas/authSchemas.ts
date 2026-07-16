import { z } from 'zod'

// HTTP-shape validation only — domain value objects (Email, Username, Password)
// remain the authority on business rules
const nonEmptyString = z.string().min(1)

export const signUpSchema = z.object({
  username: nonEmptyString,
  email: nonEmptyString,
  password: nonEmptyString,
  name: nonEmptyString,
})

export const loginSchema = z.object({
  email: nonEmptyString,
  password: nonEmptyString,
})

export const refreshSchema = z.object({
  refreshToken: nonEmptyString,
})

export const logoutSchema = refreshSchema
