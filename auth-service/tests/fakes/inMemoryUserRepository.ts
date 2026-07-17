import { User } from '../../src/domain/entities/user'
import { UserRepository } from '../../src/domain/repositories/userRepository'
import { Email } from '../../src/domain/value-objects/email'
import { Username } from '../../src/domain/value-objects/username'

export class InMemoryUserRepository implements UserRepository {
  private readonly users = new Map<string, User>()

  get size(): number {
    return this.users.size
  }

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) ?? null
  }

  async findByUsername(username: Username): Promise<User | null> {
    const match = [...this.users.values()].find(
      (user) => user.username.toString() === username.toString()
    )

    return match ?? null
  }

  async findByEmail(email: Email): Promise<User | null> {
    const match = [...this.users.values()].find(
      (user) => user.email.toString() === email.toString()
    )

    return match ?? null
  }

  async save(user: User): Promise<void> {
    this.users.set(user.id, user)
  }

  async update(user: User): Promise<void> {
    this.users.set(user.id, user)
  }

  async delete(id: string): Promise<void> {
    this.users.delete(id)
  }
}
