import { Permission } from '@auth/domain/entities/permission'
import { Role, createRoleProps } from '@auth/domain/entities/role'
import { CreateUserProps, User } from '@auth/domain/entities/user'
import { UserStatus } from '@auth/domain/enums/userStatus'
import { Email } from '@auth/domain/value-objects/email'
import { Username } from '@auth/domain/value-objects/username'

// Permission is a plain interface, not an entity — the id is only ever used to
// dedupe within a role, so it is derived from the name.
export const buildPermission = (name: string, overrides: Partial<Permission> = {}): Permission => ({
  id: `permission-${name}`,
  name,
  description: `Allows ${name}`,
  ...overrides,
})

export const buildRole = (overrides: Partial<createRoleProps> = {}): Role =>
  Role.create({
    id: 'role-1',
    name: 'user',
    description: 'Default role',
    permissions: [buildPermission('catalog:read')],
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
