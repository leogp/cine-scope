import { Permission } from './permission'

export interface createRoleProps {
  id: string
  name: string
  description: string
  permissions?: Permission[]
}

export class Role {
  private constructor(
    private readonly _id: string,
    private readonly _name: string,
    private readonly _description: string,
    private readonly _permissions: Permission[]
  ) {}

  static create(props: createRoleProps): Role {
    return new Role(props.id, props.name, props.description, props.permissions ?? [])
  }

  assignPermission(permission: Permission): void {
    const alreadyAssigned = this._permissions.some((p) => p.id === permission.id)

    if (alreadyAssigned) {
      return
    }

    this._permissions.push(permission)
  }

  // Getters
  get id(): string {
    return this._id
  }

  get name(): string {
    return this._name
  }

  get description(): string {
    return this._description
  }

  get permissions(): Permission[] {
    return [...this._permissions]
  }
}
