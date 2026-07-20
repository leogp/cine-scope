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
