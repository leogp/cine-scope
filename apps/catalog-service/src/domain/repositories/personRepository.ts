import { Person } from '../entities/person'

export interface PersonRepository {
  findById(id: string): Promise<Person | null>

  save(person: Person): Promise<void>

  exists(id: string): Promise<boolean>

  delete(id: string): Promise<void>
}
