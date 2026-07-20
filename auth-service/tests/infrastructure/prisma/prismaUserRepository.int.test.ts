import { UserStatus } from '../../../src/domain/enums/userStatus'
import { Email } from '../../../src/domain/value-objects/email'
import { Username } from '../../../src/domain/value-objects/username'
import { PrismaRoleRepository } from '../../../src/infrastructure/prisma/role'
import { PrismaUserRepository } from '../../../src/infrastructure/prisma/user'
import { buildRole, buildUser } from '../../helpers/builders'
import { createTestPrisma, truncateAll } from '../../helpers/testDb'

const prisma = createTestPrisma()
const userRepository = new PrismaUserRepository(prisma)
const roleRepository = new PrismaRoleRepository(prisma)

beforeEach(async () => {
  await truncateAll(prisma)
})

afterAll(async () => {
  await prisma.$disconnect()
})

describe('PrismaUserRepository', () => {
  it('saves a user with roles and rehydrates it by email', async () => {
    const role = buildRole()
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
