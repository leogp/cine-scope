import { User } from '../entities/user'
import { Email } from '../value-objects/email'
import { Username } from '../value-objects/username'

export interface UserRepository {
  findById(id: string): Promise<User | null>

  findByUsername(username: Username): Promise<User | null>

  findByEmail(email: Email): Promise<User | null>

  save(user: User): Promise<void>

  update(user: User): Promise<void>

  delete(id: string): Promise<void>
}
