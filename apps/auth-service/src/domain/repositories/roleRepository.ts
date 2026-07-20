import { Role } from '../entities/role'

export interface RoleRepository {
  findById(id: string): Promise<Role | null>

  findByName(name: string): Promise<Role | null>

  getDefaultRole(): Promise<Role | null>

  save(role: Role): Promise<void>

  update(role: Role): Promise<void>

  delete(id: string): Promise<void>
}
