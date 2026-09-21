import { AggregateRoot, EntityProps } from '@cinescope/shared/domain'
import { UserStatus } from '../enums/userStatus'
import { Email } from '../value-objects/email'
import { Username } from '../value-objects/username'
import { Role } from './role'

export interface UserProps extends EntityProps {
  username: Username
  email: Email
  passwordHash: string
  name: string
  status: UserStatus
  // readonly at the type level: external readers (via `data`) cannot mutate
  // the collection; assignRole reassigns it instead of pushing.
  roles: readonly Role[]
}

export interface CreateUserProps {
  id: string
  username: Username
  email: Email
  passwordHash: string
  name: string
  status: UserStatus
  roles?: Role[]
}

export class User extends AggregateRoot<UserProps> {
  private constructor(props: UserProps) {
    super(props)
  }

  /**
   * Creates a new User.
   */
  static create(props: CreateUserProps): User {
    return new User({
      id: props.id,
      username: props.username,
      email: props.email,
      passwordHash: props.passwordHash,
      name: props.name,
      status: props.status ?? UserStatus.ACTIVE,
      roles: props.roles ?? [],
    })
  }

  /**
   * The caller's effective permissions: every permission granted by any assigned
   * role, deduplicated and sorted.
   *
   * It lives on the aggregate rather than in the use cases because both login and
   * refresh need the same answer, and "what may this user do" is a question about
   * the user, not about token issuance.
   */
  permissionNames(): string[] {
    const names = new Set<string>()

    for (const role of this.props.roles) {
      for (const permission of role.data.permissions) {
        names.add(permission.name)
      }
    }

    return [...names].sort()
  }

  assignRole(role: Role): void {
    const alreadyAssigned = this.props.roles.some((r) => r.id === role.id)

    if (alreadyAssigned) {
      return
    }

    this.props.roles = [...this.props.roles, role]
  }

  changePassword(hashedPassword: string): void {
    this.props.passwordHash = hashedPassword
  }

  activate(): void {
    this.props.status = UserStatus.ACTIVE
  }

  deactivate(): void {
    this.props.status = UserStatus.INACTIVE
  }
}
