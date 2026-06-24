import { User } from '../entities/user'

export interface UserRepository {
  findById(id: string): Promise<User | null>

  findByUsername(username: string): Promise<User | null>

  findByEmail(email: string): Promise<User | null>

  save(user: User): Promise<User | null>

  update(user: User): Promise<User | null>

  delete(id: string): Promise<void>
}
