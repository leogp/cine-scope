import { Permission } from '@auth/domain/entities/permission'
import { PermissionModel } from '../generated/models'

export interface PermissionPersistence {
  id: string
  name: string
  description: string
}

export class PrismaPermissionMapper {
  static toDomain(row: PermissionModel): Permission {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
    }
  }

  static toPersistence(permission: Permission): PermissionPersistence {
    return {
      id: permission.id,
      name: permission.name,
      description: permission.description,
    }
  }
}
