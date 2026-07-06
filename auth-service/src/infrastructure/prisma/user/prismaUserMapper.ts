import { User } from '../../../domain/entities/user'
import { UserStatus } from '../../../domain/enums/userStatus'
import { Email } from '../../../domain/value-objects/email'
import { Username } from '../../../domain/value-objects/username'
import { UserStatus as PrismaUserStatus } from '../generated/enums'
import { UserModel } from '../generated/models'
import { PrismaRoleMapper, RoleRow } from '../role/prismaRoleMapper'

/**
 * Row shape the mapper accepts: user scalars plus, when the repository chose
 * to load them, the user_roles join rows with their Role.
 */
export type UserRow = UserModel & {
  roles?: { role: RoleRow }[]
}

export interface UserPersistence {
  id: string
  username: string
  email: string
  passwordHash: string
  name: string
  status: PrismaUserStatus
}

const statusToDomain: Record<PrismaUserStatus, UserStatus> = {
  ACTIVE: UserStatus.ACTIVE,
  INACTIVE: UserStatus.INACTIVE,
}

const statusToPersistence: Record<UserStatus, PrismaUserStatus> = {
  [UserStatus.ACTIVE]: 'ACTIVE',
  [UserStatus.INACTIVE]: 'INACTIVE',
}

export class PrismaUserMapper {
  static toDomain(row: UserRow): User {
    return User.create({
      id: row.id,
      username: new Username(row.username),
      email: new Email(row.email),
      passwordHash: row.passwordHash,
      name: row.name,
      status: statusToDomain[row.status],
      roles: row.roles?.map((userRole) => PrismaRoleMapper.toDomain(userRole.role)),
    })
  }

  /**
   * Scalar columns only — role assignments are written by the repository
   * through specific operations or nested writes on the user_roles relation.
   */
  static toPersistence(user: User): UserPersistence {
    return {
      id: user.id,
      username: user.username.toString(),
      email: user.email.toString(),
      passwordHash: user.passwordHash,
      name: user.name,
      status: statusToPersistence[user.status],
    }
  }
}
