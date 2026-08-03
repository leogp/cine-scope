import { UseCase } from '@cinescope/shared/application'
import { PersonNotFoundError } from '@catalog/domain/errors/personNotFoundError'
import { PersonRepository } from '@catalog/domain/repositories/personRepository'
import { GetPersonRequest } from './getPersonRequest'
import { GetPersonResponse } from './getPersonResponse'

export class GetPersonUseCase implements UseCase<GetPersonRequest, GetPersonResponse> {
  constructor(private readonly personRepository: PersonRepository) {}

  async execute(request: GetPersonRequest): Promise<GetPersonResponse> {
    const person = await this.personRepository.findById(request.id)

    if (!person) {
      throw new PersonNotFoundError()
    }

    const { name, biography, birthDate, profilePath, createdAt, updatedAt } = person.data

    return {
      id: person.id,
      name: name.value,
      biography,
      birthDate,
      profilePath,
      createdAt,
      updatedAt,
    }
  }
}
