import { UserStatus } from '@auth/domain/enums/userStatus'
import { Email } from '@auth/domain/value-objects/email'
import { Username } from '@auth/domain/value-objects/username'
import { PrismaPermissionRepository } from '@auth/infrastructure/prisma/permission'
import { PrismaRoleRepository } from '@auth/infrastructure/prisma/role'
import { PrismaUserRepository } from '@auth/infrastructure/prisma/user'
import { buildPermission, buildRole, buildUser } from '../../helpers/builders'
import { createTestPrisma, truncateAll } from '../../helpers/testDb'

const prisma = createTestPrisma()
const userRepository = new PrismaUserRepository(prisma)
const roleRepository = new PrismaRoleRepository(prisma)
const permissionRepository = new PrismaPermissionRepository(prisma)

beforeEach(async () => {
  await truncateAll(prisma)
})

afterAll(async () => {
  await prisma.$disconnect()
})

describe('PrismaUserRepository', () => {
  it('saves a user with roles and rehydrates it, permissions included, by email', async () => {
    // role_permissions references permissions, so the permission must exist first.
    const catalogRead = buildPermission('catalog:read')
    await permissionRepository.save(catalogRead)
    const role = buildRole({ permissions: [catalogRead] })
    await roleRepository.save(role)

    const user = buildUser()
    user.assignRole(role)
    await userRepository.save(user)

    const found = await userRepository.findByEmail(new Email('leo@example.com'))

    expect(found).not.toBeNull()
    expect(found!.id).toBe(user.id)
    expect(found!.data.username.toString()).toBe('leo_dev')
    expect(found!.data.email.toString()).toBe('leo@example.com')
    expect(found!.data.passwordHash).toBe(user.data.passwordHash)
    expect(found!.data.status).toBe(UserStatus.ACTIVE)
    expect(found!.data.roles.map((r) => r.data.name)).toEqual(['user'])
    // The access token's permissions claim is built from this nested load.
    expect(found!.permissionNames()).toEqual(['catalog:read'])
  })

  it('round-trips an INACTIVE status, on save and on update', async () => {
    const user = buildUser({ status: UserStatus.INACTIVE })
    await userRepository.save(user)

    const saved = await userRepository.findById(user.id)
    expect(saved!.data.status).toBe(UserStatus.INACTIVE)
    expect(saved!.isActive()).toBe(false)

    saved!.activate()
    await userRepository.update(saved!)

    const reactivated = await userRepository.findById(user.id)
    expect(reactivated!.isActive()).toBe(true)
  })

  it('finds a user by username and by id', async () => {
    const user = buildUser()
    await userRepository.save(user)

    const byUsername = await userRepository.findByUsername(new Username('leo_dev'))
    const byId = await userRepository.findById(user.id)

    expect(byUsername!.id).toBe(user.id)
    expect(byId!.data.email.toString()).toBe('leo@example.com')
  })

  it('returns null when no user matches', async () => {
    expect(await userRepository.findByEmail(new Email('ghost@example.com'))).toBeNull()
    expect(await userRepository.findByUsername(new Username('ghost'))).toBeNull()
    expect(await userRepository.findById('ghost-id')).toBeNull()
  })

  it('persists updates to the user', async () => {
    const user = buildUser()
    await userRepository.save(user)

    user.changePassword('hashed:N3w!Password')
    await userRepository.update(user)

    const found = await userRepository.findById(user.id)
    expect(found!.data.passwordHash).toBe('hashed:N3w!Password')
  })
})
