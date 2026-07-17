import { DEFAULT_ROLE_NAME, PrismaRoleRepository } from '../../../src/infrastructure/prisma/role'
import { buildRole } from '../../helpers/builders'
import { createTestPrisma, truncateAll } from '../../helpers/testDb'

const prisma = createTestPrisma()
const roleRepository = new PrismaRoleRepository(prisma)

beforeEach(async () => {
  await truncateAll(prisma)
})

afterAll(async () => {
  await prisma.$disconnect()
})

describe('PrismaRoleRepository', () => {
  it('saves a role and rehydrates it by name', async () => {
    await roleRepository.save(buildRole())

    const found = await roleRepository.findByName('user')

    expect(found).not.toBeNull()
    expect(found!.id).toBe('role-1')
    expect(found!.description).toBe('Default role')
    expect(found!.permissions).toEqual([])
  })

  it('returns the role named after DEFAULT_ROLE_NAME as the default role', async () => {
    await roleRepository.save(buildRole({ id: 'role-admin', name: 'admin' }))
    await roleRepository.save(buildRole({ name: DEFAULT_ROLE_NAME }))

    const defaultRole = await roleRepository.getDefaultRole()

    expect(defaultRole!.name).toBe(DEFAULT_ROLE_NAME)
    expect(defaultRole!.id).toBe('role-1')
  })

  it('returns null when the default role has not been seeded', async () => {
    expect(await roleRepository.getDefaultRole()).toBeNull()
  })
})
