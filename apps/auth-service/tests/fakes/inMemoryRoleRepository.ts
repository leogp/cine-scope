import { Role } from '../../src/domain/entities/role'
import { RoleRepository } from '../../src/domain/repositories/roleRepository'

export class InMemoryRoleRepository implements RoleRepository {
  private readonly roles = new Map<string, Role>()

  constructor(private defaultRole: Role | null = null) {
    if (defaultRole) {
      this.roles.set(defaultRole.id, defaultRole)
    }
  }

  async findById(id: string): Promise<Role | null> {
    return this.roles.get(id) ?? null
  }

  async findByName(name: string): Promise<Role | null> {
    const match = [...this.roles.values()].find((role) => role.data.name === name)

    return match ?? null
  }

  async getDefaultRole(): Promise<Role | null> {
    return this.defaultRole
  }

  async save(role: Role): Promise<void> {
    this.roles.set(role.id, role)
  }

  async update(role: Role): Promise<void> {
    this.roles.set(role.id, role)
  }

  async delete(id: string): Promise<void> {
    this.roles.delete(id)
  }
}
