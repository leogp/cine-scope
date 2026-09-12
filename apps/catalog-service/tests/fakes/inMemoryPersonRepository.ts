import { Person } from '@catalog/domain/entities/person'
import { PersonRepository } from '@catalog/domain/repositories/personRepository'

export class InMemoryPersonRepository implements PersonRepository {
  private readonly people = new Map<string, Person>()

  get size(): number {
    return this.people.size
  }

  async findById(id: string): Promise<Person | null> {
    return this.people.get(id) ?? null
  }

  async save(person: Person): Promise<void> {
    this.people.set(person.id, person)
  }

  async exists(id: string): Promise<boolean> {
    return this.people.has(id)
  }

  async delete(id: string): Promise<void> {
    this.people.delete(id)
  }
}
