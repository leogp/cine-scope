import { UseCase } from '@cinescope/shared/application'
import { Person } from '@catalog/domain/entities/person'
import { PersonRepository } from '@catalog/domain/repositories/personRepository'
import { PersonName } from '@catalog/domain/value-objects/personName'
import { CreatePersonRequest } from './createPersonRequest'
import { CreatePersonResponse } from './createPersonResponse'

export class CreatePersonUseCase implements UseCase<CreatePersonRequest, CreatePersonResponse> {
  constructor(private readonly personRepository: PersonRepository) {}

  async execute(request: CreatePersonRequest): Promise<CreatePersonResponse> {
    const name = new PersonName(request.name)

    const person = Person.create({
      name,
      biography: request.biography ?? null,
      birthDate: request.birthDate ?? null,
      profilePath: request.profilePath ?? null,
    })

    await this.personRepository.save(person)

    return {
      id: person.id,
    }
  }
}
