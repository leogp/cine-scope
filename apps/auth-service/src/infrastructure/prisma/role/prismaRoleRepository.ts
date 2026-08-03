import { Role } from '@auth/domain/entities/role'
import { RoleRepository } from '@auth/domain/repositories/roleRepository'
import { PrismaClient } from '../generated/client'
import { PrismaRoleMapper } from './prismaRoleMapper'

/** Role assigned to every new user on signup. */
export const DEFAULT_ROLE_NAME = 'user'

/**
 * Rehydrating a Role loads its role_permissions join rows plus their
 * Permission.
 */
const roleWithPermissionsInclude = {
  permissions: { include: { permission: true } },
} as const

export class PrismaRoleRepository implements RoleRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<Role | null> {
    const row = await this.prisma.role.findUnique({
      where: { id },
      include: roleWithPermissionsInclude,
    })

    return row ? PrismaRoleMapper.toDomain(row) : null
  }

  async findByName(name: string): Promise<Role | null> {
    const row = await this.prisma.role.findUnique({
      where: { name },
      include: roleWithPermissionsInclude,
    })

    return row ? PrismaRoleMapper.toDomain(row) : null
  }

  async getDefaultRole(): Promise<Role | null> {
    return this.findByName(DEFAULT_ROLE_NAME)
  }

  async save(role: Role): Promise<void> {
    await this.prisma.role.create({
      data: {
        ...PrismaRoleMapper.toPersistence(role),
        permissions: {
          create: role.data.permissions.map((permission) => ({ permissionId: permission.id })),
        },
      },
    })
  }

  async update(role: Role): Promise<void> {
    const { id, ...data } = PrismaRoleMapper.toPersistence(role)

    await this.prisma.role.update({
      where: { id },
      data: {
        ...data,
        // Replace permission assignments with the entity's current set
        permissions: {
          deleteMany: {},
          create: role.data.permissions.map((permission) => ({ permissionId: permission.id })),
        },
      },
    })
  }

  async delete(id: string): Promise<void> {
    await this.prisma.role.delete({ where: { id } })
  }
}
