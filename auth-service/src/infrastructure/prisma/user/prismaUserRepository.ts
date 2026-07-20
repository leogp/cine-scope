import { User } from '../../../domain/entities/user'
import { UserRepository } from '../../../domain/repositories/userRepository'
import { Email } from '../../../domain/value-objects/email'
import { Username } from '../../../domain/value-objects/username'
import { PrismaClient } from '../generated/client'
import { PrismaUserMapper } from './prismaUserMapper'

/**
 * Rehydrating a User loads its user_roles join rows plus their Role.
 * Role permissions are not loaded here — fetch them through RoleRepository
 * when needed.
 */
const userWithRolesInclude = {
  roles: { include: { role: true } },
} as const

export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({
      where: { id },
      include: userWithRolesInclude,
    })

    return row ? PrismaUserMapper.toDomain(row) : null
  }

  async findByUsername(username: Username): Promise<User | null> {
    const row = await this.prisma.user.findUnique({
      where: { username: username.toString() },
      include: userWithRolesInclude,
    })

    return row ? PrismaUserMapper.toDomain(row) : null
  }

  async findByEmail(email: Email): Promise<User | null> {
    const row = await this.prisma.user.findUnique({
      where: { email: email.toString() },
      include: userWithRolesInclude,
    })

    return row ? PrismaUserMapper.toDomain(row) : null
  }

  async save(user: User): Promise<void> {
    await this.prisma.user.create({
      data: {
        ...PrismaUserMapper.toPersistence(user),
        roles: {
          create: user.data.roles.map((role) => ({ roleId: role.id })),
        },
      },
    })
  }

  async update(user: User): Promise<void> {
    const { id, ...data } = PrismaUserMapper.toPersistence(user)

    await this.prisma.user.update({
      where: { id },
      data: {
        ...data,
        // Replace role assignments with the entity's current set
        roles: {
          deleteMany: {},
          create: user.data.roles.map((role) => ({ roleId: role.id })),
        },
      },
    })
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({ where: { id } })
  }
}
