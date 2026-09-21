import { User } from '@auth/domain/entities/user'
import { Role } from '@auth/domain/entities/role'
import { UserStatus } from '@auth/domain/enums/userStatus'
import { Email } from '@auth/domain/value-objects/email'
import { Username } from '@auth/domain/value-objects/username'

const buildUser = () =>
  User.create({
    id: 'user-1',
    username: new Username('leo_dev'),
    email: new Email('leo@example.com'),
    passwordHash: 'hashed-password',
    name: 'Leo',
    status: UserStatus.ACTIVE,
  })

const buildRole = (id = 'role-1') => Role.create({ id, name: 'user', description: 'Default role' })

const buildPermission = (name: string) => ({
  id: `permission-${name}`,
  name,
  description: `Allows ${name}`,
})

const buildRoleWith = (id: string, name: string, permissions: string[]) =>
  Role.create({
    id,
    name,
    description: `${name} role`,
    permissions: permissions.map(buildPermission),
  })

describe('User', () => {
  it('creates a user with the given props and no roles by default', () => {
    const user = buildUser()

    expect(user.id).toBe('user-1')
    expect(user.data.username.toString()).toBe('leo_dev')
    expect(user.data.email.toString()).toBe('leo@example.com')
    expect(user.data.passwordHash).toBe('hashed-password')
    expect(user.data.name).toBe('Leo')
    expect(user.data.status).toBe(UserStatus.ACTIVE)
    expect(user.data.roles).toEqual([])
  })

  it('assigns a role', () => {
    const user = buildUser()
    const role = buildRole()

    user.assignRole(role)

    expect(user.data.roles).toHaveLength(1)
    expect(user.data.roles[0].id).toBe('role-1')
  })

  it('does not assign the same role twice', () => {
    const user = buildUser()

    user.assignRole(buildRole())
    user.assignRole(buildRole())

    expect(user.data.roles).toHaveLength(1)
  })

  it('exposes roles as a stable snapshot: assignRole reassigns instead of mutating', () => {
    const user = buildUser()
    const before = user.data.roles

    user.assignRole(buildRole())
    const after = user.data.roles

    // The snapshot read before the change is untouched, and the collection was
    // replaced (not mutated in place), so the entity cannot be mutated through
    // a previously read reference.
    expect(before).toHaveLength(0)
    expect(after).toHaveLength(1)
    expect(before).not.toBe(after)
  })

  it('changes the password hash', () => {
    const user = buildUser()

    user.changePassword('new-hash')

    expect(user.data.passwordHash).toBe('new-hash')
  })

  it('activates and deactivates the user', () => {
    const user = buildUser()

    user.deactivate()
    expect(user.data.status).toBe(UserStatus.INACTIVE)

    user.activate()
    expect(user.data.status).toBe(UserStatus.ACTIVE)
  })

  describe('permissionNames', () => {
    it('has no permissions without roles', () => {
      expect(buildUser().permissionNames()).toEqual([])
    })

    it('has no permissions when its roles grant none', () => {
      const user = buildUser()

      user.assignRole(buildRole())

      expect(user.permissionNames()).toEqual([])
    })

    it('collects the permissions of a single role', () => {
      const user = buildUser()

      user.assignRole(buildRoleWith('role-1', 'editor', ['catalog:write', 'catalog:read']))

      expect(user.permissionNames()).toEqual(['catalog:read', 'catalog:write'])
    })

    it('unions the permissions of every role, deduplicating overlaps', () => {
      const user = buildUser()

      user.assignRole(buildRoleWith('role-1', 'user', ['catalog:read', 'reviews:write']))
      user.assignRole(buildRoleWith('role-2', 'editor', ['catalog:read', 'catalog:write']))

      // catalog:read is granted by both roles but must appear once — the access
      // token claim is a set, not a tally.
      expect(user.permissionNames()).toEqual(['catalog:read', 'catalog:write', 'reviews:write'])
    })

    it('returns names sorted, independently of role assignment order', () => {
      const first = buildUser()
      first.assignRole(buildRoleWith('role-1', 'a', ['users:manage']))
      first.assignRole(buildRoleWith('role-2', 'b', ['catalog:write']))

      const second = buildUser()
      second.assignRole(buildRoleWith('role-2', 'b', ['catalog:write']))
      second.assignRole(buildRoleWith('role-1', 'a', ['users:manage']))

      expect(first.permissionNames()).toEqual(second.permissionNames())
      expect(first.permissionNames()).toEqual(['catalog:write', 'users:manage'])
    })
  })
})
