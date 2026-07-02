import { Email } from '../../../domain/value-objects/email'

export interface LoginRequest {
  email: Email
  password: string
}
