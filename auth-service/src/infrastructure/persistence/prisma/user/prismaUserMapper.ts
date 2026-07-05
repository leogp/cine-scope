import { User } from '../../../../domain/entities/user'
import { Role } from '../../../../domain/entities/role'
import { UserStatus } from '../../../../domain/enums/userStatus'
import { Email } from '../../../../domain/value-objects/email'
import { Username } from '../../../../domain/value-objects/username'
import { UserStatus as PrismaUserStatus } from '../generated/enums'
import { UserGetPayload } from '../generated/models'

/**
 * Include needed to rehydrate a domain User: join rows plus their Role.
 */
export const userWithRolesInclude = {
  roles: { include: { role: true } },
} as const

export type UserWithRoles = UserGetPayload<{ include: typeof userWithRolesInclude }>

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
  static toDomain(row: UserWithRoles): User {
    return User.create({
      id: row.id,
      username: new Username(row.username),
      email: new Email(row.email),
      passwordHash: row.passwordHash,
      name: row.name,
      status: statusToDomain[row.status],
      roles: row.roles.map((userRole) => {
        return new Role(userRole.role.id, userRole.role.name, userRole.role.description)
      }),
    })
  }

  /**
   * Scalar columns only — role assignments are written by the repository
   * through nested writes on the user_roles relation.
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
