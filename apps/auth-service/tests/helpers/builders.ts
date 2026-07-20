import { Role, createRoleProps } from '../../src/domain/entities/role'
import { CreateUserProps, User } from '../../src/domain/entities/user'
import { UserStatus } from '../../src/domain/enums/userStatus'
import { Email } from '../../src/domain/value-objects/email'
import { Username } from '../../src/domain/value-objects/username'

export const buildRole = (overrides: Partial<createRoleProps> = {}): Role =>
  Role.create({
    id: 'role-1',
    name: 'user',
    description: 'Default role',
    ...overrides,
  })

export const buildUser = (overrides: Partial<CreateUserProps> = {}): User =>
  User.create({
    id: 'user-1',
    username: new Username('leo_dev'),
    email: new Email('leo@example.com'),
    passwordHash: 'hashed:Str0ng!Pass',
    name: 'Leo',
    status: UserStatus.ACTIVE,
    ...overrides,
  })
