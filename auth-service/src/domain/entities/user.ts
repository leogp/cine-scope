import { UserStatus } from '../enums/userStatus'
import { Role } from './role'

export class User {
  private readonly _id: string
  private readonly _username: string
  private readonly _email: string
  private readonly _name: string
  private _password: string
  private _status: UserStatus
  private readonly roles: Role[]

  constructor(
    id: string,
    username: string,
    email: string,
    password: string,
    name: string,
    status: UserStatus,
    roles: Role[] = []
  ) {
    this._id = id
    this._username = username
    this._email = email
    this._password = password
    this._name = name
    this._status = status
    this.roles = roles
  }

  assignRole(role: Role): void {
    const alreadyAssigned = this.roles.some((r) => r.id === role.id)

    if (alreadyAssigned) {
      return
    }

    this.roles.push(role)
  }

  changePassword(hashedPassword: string) {
    this._password = hashedPassword
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

  get username(): string {
    return this._username
  }

  get email(): string {
    return this._email
  }

  get name(): string {
    return this._name
  }

  get password(): string {
    return this._password
  }

  get status(): UserStatus {
    return this._status
  }

  getRoles(): Role[] {
    return this.roles
  }
}
