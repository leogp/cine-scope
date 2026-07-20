import { Permission } from '../entities/permission'

export interface PermissionRepository {
  findById(id: string): Promise<Permission | null>

  findByName(name: string): Promise<Permission | null>

  save(permission: Permission): Promise<void>

  update(permission: Permission): Promise<void>

  delete(id: string): Promise<void>
}
