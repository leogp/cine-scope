import { PasswordHasher } from '@auth/domain/services/passwordHasher'

/**
 * Deterministic hasher so tests can build users with a known "hash"
 * without paying the cost of real bcrypt.
 */
export class FakePasswordHasher implements PasswordHasher {
  async hash(password: string): Promise<string> {
    return `hashed:${password}`
  }

  async compare(plainPassword: string, hash: string): Promise<boolean> {
    return hash === `hashed:${plainPassword}`
  }
}
