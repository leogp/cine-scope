import { Permission } from '../../../domain/entities/permission'
import { PermissionRepository } from '../../../domain/repositories/permissionRepository'
import { PrismaClient } from '../generated/client'
import { PrismaPermissionMapper } from './prismaPermissionMapper'

export class PrismaPermissionRepository implements PermissionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<Permission | null> {
    const row = await this.prisma.permission.findUnique({ where: { id } })

    return row ? PrismaPermissionMapper.toDomain(row) : null
  }

  async findByName(name: string): Promise<Permission | null> {
    const row = await this.prisma.permission.findUnique({ where: { name } })

    return row ? PrismaPermissionMapper.toDomain(row) : null
  }

  async save(permission: Permission): Promise<void> {
    await this.prisma.permission.create({
      data: PrismaPermissionMapper.toPersistence(permission),
    })
  }

  async update(permission: Permission): Promise<void> {
    const { id, ...data } = PrismaPermissionMapper.toPersistence(permission)

    await this.prisma.permission.update({ where: { id }, data })
  }

  async delete(id: string): Promise<void> {
    await this.prisma.permission.delete({ where: { id } })
  }
}
