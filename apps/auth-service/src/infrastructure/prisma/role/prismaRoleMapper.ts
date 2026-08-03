import { Role } from '@auth/domain/entities/role'
import { PermissionModel, RoleModel } from '../generated/models'
import { PrismaPermissionMapper } from '../permission/prismaPermissionMapper'

/**
 * Row shape the mapper accepts: role scalars plus, when the repository chose
 * to load them, the role_permissions join rows with their Permission.
 */
export type RoleRow = RoleModel & {
  permissions?: { permission: PermissionModel }[]
}

export interface RolePersistence {
  id: string
  name: string
  description: string
}

export class PrismaRoleMapper {
  static toDomain(row: RoleRow): Role {
    return Role.create({
      id: row.id,
      name: row.name,
      description: row.description,
      permissions: row.permissions?.map((rolePermission) =>
        PrismaPermissionMapper.toDomain(rolePermission.permission)
      ),
    })
  }

  /**
   * Scalar columns only — permission assignments are written by the
   * repository through nested writes on the role_permissions relation.
   */
  static toPersistence(role: Role): RolePersistence {
    return {
      id: role.id,
      name: role.data.name,
      description: role.data.description,
    }
  }
}
