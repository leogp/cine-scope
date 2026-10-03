import { PrismaPermissionRepository } from '@auth/infrastructure/prisma/permission'
import { DEFAULT_ROLE_NAME, PrismaRoleRepository } from '@auth/infrastructure/prisma/role'
import { buildPermission, buildRole } from '../../helpers/builders'
import { createTestPrisma, truncateAll } from '../../helpers/testDb'

const prisma = createTestPrisma()
const roleRepository = new PrismaRoleRepository(prisma)
const permissionRepository = new PrismaPermissionRepository(prisma)

// Permissions are reference data — seeded, never created through a role — and
// role_permissions has a foreign key to them, so they must exist first.
const savePermissions = async (...names: string[]) => {
  const permissions = names.map((name) => buildPermission(name))
  await Promise.all(permissions.map((permission) => permissionRepository.save(permission)))
  return permissions
}

beforeEach(async () => {
  await truncateAll(prisma)
})

afterAll(async () => {
  await prisma.$disconnect()
})

describe('PrismaRoleRepository', () => {
  it('saves a role and rehydrates it with its permissions by name', async () => {
    const [catalogRead] = await savePermissions('catalog:read')
    await roleRepository.save(buildRole({ permissions: [catalogRead] }))

    const found = await roleRepository.findByName('user')

    expect(found).not.toBeNull()
    expect(found!.id).toBe('role-1')
    expect(found!.data.description).toBe('Default role')
    expect(found!.data.permissions).toEqual([catalogRead])
  })

  it('refuses to assign a permission that has not been persisted', async () => {
    await expect(roleRepository.save(buildRole())).rejects.toThrow(
      /role_permissions_permission_id_fkey/
    )
  })

  it('replaces the permission set on update', async () => {
    const [catalogRead, catalogWrite] = await savePermissions('catalog:read', 'catalog:write')
    await roleRepository.save(buildRole({ permissions: [catalogRead] }))

    await roleRepository.update(buildRole({ permissions: [catalogWrite] }))

    const found = await roleRepository.findById('role-1')
    expect(found!.data.permissions).toEqual([catalogWrite])
  })

  it('returns the role named after DEFAULT_ROLE_NAME as the default role', async () => {
    // Permissions play no part in which role is the default.
    await roleRepository.save(buildRole({ id: 'role-admin', name: 'admin', permissions: [] }))
    await roleRepository.save(buildRole({ name: DEFAULT_ROLE_NAME, permissions: [] }))

    const defaultRole = await roleRepository.getDefaultRole()

    expect(defaultRole!.data.name).toBe(DEFAULT_ROLE_NAME)
    expect(defaultRole!.id).toBe('role-1')
  })

  it('returns null when the default role has not been seeded', async () => {
    expect(await roleRepository.getDefaultRole()).toBeNull()
  })
})
