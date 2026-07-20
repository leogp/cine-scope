import { Entity, EntityProps } from '@cinescope/shared/domain'
import { Permission } from './permission'

export interface RoleProps extends EntityProps {
  name: string
  description: string
  // readonly at the type level, like User.roles — assignPermission reassigns.
  permissions: readonly Permission[]
}

export interface createRoleProps {
  id: string
  name: string
  description: string
  permissions?: Permission[]
}

export class Role extends Entity<RoleProps> {
  private constructor(props: RoleProps) {
    super(props)
  }

  static create(props: createRoleProps): Role {
    return new Role({
      id: props.id,
      name: props.name,
      description: props.description,
      permissions: props.permissions ?? [],
    })
  }

  assignPermission(permission: Permission): void {
    const alreadyAssigned = this.props.permissions.some((p) => p.id === permission.id)

    if (alreadyAssigned) {
      return
    }

    this.props.permissions = [...this.props.permissions, permission]
  }
}
