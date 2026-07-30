import { Person } from '../../../domain/entities/person'
import { PersonName } from '../../../domain/value-objects/personName'
import { PersonModel } from '../generated/models'

export type PersonRow = PersonModel

export interface PersonPersistence {
  id: string
  name: string
  biography: string | null
  birthDate: Date | null
  profilePath: string | null
  createdAt: Date
  updatedAt: Date
}

export class PrismaPersonMapper {
  static toDomain(row: PersonRow): Person {
    return Person.restore({
      id: row.id,
      name: new PersonName(row.name),
      biography: row.biography,
      birthDate: row.birthDate,
      profilePath: row.profilePath,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    })
  }

  static toPersistence(person: Person): PersonPersistence {
    return {
      id: person.id,
      name: person.data.name.value,
      biography: person.data.biography,
      birthDate: person.data.birthDate,
      profilePath: person.data.profilePath,
      createdAt: person.data.createdAt,
      updatedAt: person.data.updatedAt,
    }
  }
}
