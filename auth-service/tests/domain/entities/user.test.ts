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
    expect(user.username.toString()).toBe('leo_dev')
    expect(user.email.toString()).toBe('leo@example.com')
    expect(user.passwordHash).toBe('hashed-password')
    expect(user.name).toBe('Leo')
    expect(user.status).toBe(UserStatus.ACTIVE)
    expect(user.roles).toEqual([])
  })

  it('assigns a role', () => {
    const user = buildUser()
    const role = buildRole()

    user.assignRole(role)

    expect(user.roles).toHaveLength(1)
    expect(user.roles[0].id).toBe('role-1')
  })

  it('does not assign the same role twice', () => {
    const user = buildUser()

    user.assignRole(buildRole())
    user.assignRole(buildRole())

    expect(user.roles).toHaveLength(1)
  })

  it('returns a copy of the roles so the internal list cannot be mutated', () => {
    const user = buildUser()
    user.assignRole(buildRole())

    user.roles.pop()

    expect(user.roles).toHaveLength(1)
  })

  it('changes the password hash', () => {
    const user = buildUser()

    user.changePassword('new-hash')

    expect(user.passwordHash).toBe('new-hash')
  })

  it('activates and deactivates the user', () => {
    const user = buildUser()

    user.deactivate()
    expect(user.status).toBe(UserStatus.INACTIVE)

    user.activate()
    expect(user.status).toBe(UserStatus.ACTIVE)
  })
})
