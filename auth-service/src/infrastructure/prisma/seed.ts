import { randomUUID } from 'crypto'
import { prisma } from './client'
import { DEFAULT_ROLE_NAME } from './role/prismaRoleRepository'
import { BcryptPasswordHasher } from '../security/bcryptPasswordHasher'

// Dev-only fallback; override with SEED_USER_PASSWORD. Satisfies the Password
// value object rules so the seeded user can log in.
const DEFAULT_SEED_USER_PASSWORD = 'ChangeMe123!'

const PERMISSIONS: Record<string, string> = {
  'catalog:read': 'Browse movies and shows',
  'reviews:write': 'Write and edit own reviews',
  'watchlist:manage': 'Manage own watchlist',
  'catalog:write': 'Create and edit catalog entries',
  'reviews:moderate': 'Moderate any user review',
  'users:manage': 'Manage user accounts',
  'roles:manage': 'Manage roles and permissions',
}

const ROLES: Record<string, { description: string; permissions: string[] }> = {
  [DEFAULT_ROLE_NAME]: {
    description: 'Default role assigned on signup',
    permissions: ['catalog:read', 'reviews:write', 'watchlist:manage'],
  },
  editor: {
    description: 'Curates the catalog and moderates reviews',
    permissions: [
      'catalog:read',
      'reviews:write',
      'watchlist:manage',
      'catalog:write',
      'reviews:moderate',
    ],
  },
  admin: {
    description: 'Full administrative access',
    permissions: Object.keys(PERMISSIONS),
  },
}

async function main(): Promise<void> {
  const permissionIds = new Map<string, string>()

  for (const [name, description] of Object.entries(PERMISSIONS)) {
    const permission = await prisma.permission.upsert({
      where: { name },
      update: { description },
      create: { id: randomUUID(), name, description },
    })

    permissionIds.set(name, permission.id)
  }

  for (const [name, { description, permissions }] of Object.entries(ROLES)) {
    const role = await prisma.role.upsert({
      where: { name },
      update: { description },
      create: { id: randomUUID(), name, description },
    })

    for (const permissionName of permissions) {
      const permissionId = permissionIds.get(permissionName)!

      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId } },
        update: {},
        create: { roleId: role.id, permissionId },
      })
    }
  }

  const passwordHash = await new BcryptPasswordHasher().hash(
    process.env.SEED_USER_PASSWORD ?? DEFAULT_SEED_USER_PASSWORD
  )

  const user = await prisma.user.upsert({
    where: { username: 'leogp' },
    update: {
      email: 'lpuglisi@some.domain.com',
      name: 'leonardo puglisi',
      status: 'ACTIVE',
      passwordHash,
    },
    create: {
      id: randomUUID(),
      username: 'leogp',
      email: 'lpuglisi@some.domain.com',
      name: 'leonardo puglisi',
      status: 'ACTIVE',
      passwordHash,
    },
  })

  const admin = await prisma.role.findUniqueOrThrow({ where: { name: 'admin' } })

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: user.id, roleId: admin.id } },
    update: {},
    create: { userId: user.id, roleId: admin.id },
  })

  console.log(
    `Seeded ${Object.keys(PERMISSIONS).length} permissions, ` +
      `${Object.keys(ROLES).length} roles and user '${user.username}' (admin)`
  )
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
