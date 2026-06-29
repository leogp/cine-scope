import { UserStatus } from '../enums/userStatus'
import { Email } from '../value-objects/email'
import { Username } from '../value-objects/username'
import { Role } from './role'

export interface CreateUserProps {
  id: string
  username: Username
  email: Email
  passwordHash: string
  name: string
  status: UserStatus
  roles?: Role[]
}

export class User {
  private constructor(
    private readonly _id: string,
    private readonly _username: Username,
    private readonly _email: Email,
    private _passwordHash: string,
    private readonly _name: string,
    private _status: UserStatus,
    private readonly _roles: Role[]
  ) {}

  /**
   * Creates a new User.
   */
  static create(props: CreateUserProps): User {
    return new User(
      props.id,
      props.username,
      props.email,
      props.passwordHash,
      props.name,
      props.status ?? UserStatus.ACTIVE,
      props.roles ?? []
    )
  }
  assignRole(role: Role): void {
    const alreadyAssigned = this._roles.some((r) => r.id === role.id)

    if (alreadyAssigned) {
      return
    }

    this._roles.push(role)
  }

  changePassword(hashedPassword: string) {
    this._passwordHash = hashedPassword
  }

  activate() {
    this._status = UserStatus.ACTIVE
  }

  deactivate() {
    this._status = UserStatus.INACTIVE
  }

  // Getters
  get id(): string {
    return this._id
  }

  get username(): Username {
    return this._username
  }

  get email(): Email {
    return this._email
  }

  get name(): string {
    return this._name
  }

  get passwordHash(): string {
    return this._passwordHash
  }

  get status(): UserStatus {
    return this._status
  }

  getRoles(): Role[] {
    return this._roles
  }
}
