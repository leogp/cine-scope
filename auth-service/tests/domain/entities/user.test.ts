import { User } from '../../../src/domain/entities/user'
import { Role } from '../../../src/domain/entities/role'
import { UserStatus } from '../../../src/domain/enums/userStatus'
import { Email } from '../../../src/domain/value-objects/email'
import { Username } from '../../../src/domain/value-objects/username'

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
})
