import { BcryptPasswordHasher } from '../../../src/infrastructure/security/bcryptPasswordHasher'

// bcrypt with cost 12 takes ~300ms per operation, so this suite hashes once
// and reuses the result.
describe('BcryptPasswordHasher', () => {
  const hasher = new BcryptPasswordHasher()
  let hash: string

  beforeAll(async () => {
    hash = await hasher.hash('Str0ng!Pass')
  }, 15_000)

  it('produces a bcrypt hash with cost 12, different from the plain text', () => {
    expect(hash).not.toBe('Str0ng!Pass')
    expect(hash).toMatch(/^\$2[aby]\$12\$/)
  })

  it('verifies the original password against the hash', async () => {
    await expect(hasher.compare('Str0ng!Pass', hash)).resolves.toBe(true)
  })

  it('rejects a wrong password', async () => {
    await expect(hasher.compare('Wr0ng!Pass', hash)).resolves.toBe(false)
  })
})
