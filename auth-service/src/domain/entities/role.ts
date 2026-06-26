import { Permission } from './permission'

export class Role {
  public readonly id: string
  public readonly name: string
  public readonly description: string
  private permissions: Permission[]

  constructor(id: string, name: string, description: string) {
    this.id = id
    this.name = name
    this.description = description
    this.permissions = []
  }

  assignPermission(permission: Permission): void {
    const alreadyAssigned = this.permissions.some((p) => p.id === permission.id)

    if (alreadyAssigned) {
      return
    }

    this.permissions.push(permission)
  }
}
