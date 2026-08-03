import { GetPersonUseCase } from '@catalog/application/use-cases/person/get/getPersonUseCase'
import { PersonNotFoundError } from '@catalog/domain/errors/personNotFoundError'
import { InMemoryPersonRepository } from '../fakes/inMemoryPersonRepository'
import { buildPerson } from '../helpers/builders'

const makeSut = () => {
  const personRepository = new InMemoryPersonRepository()
  const useCase = new GetPersonUseCase(personRepository)

  return { useCase, personRepository }
}

describe('GetPersonUseCase', () => {
  it('returns the person with value objects unwrapped to primitives', async () => {
    const { useCase, personRepository } = makeSut()
    const person = buildPerson({ profilePath: '/profiles/greta.png' })
    await personRepository.save(person)

    const response = await useCase.execute({ id: person.id })

    expect(response).toEqual({
      id: person.id,
      name: 'Greta Gerwig',
      biography: null,
      birthDate: null,
      profilePath: '/profiles/greta.png',
      createdAt: person.data.createdAt,
      updatedAt: person.data.updatedAt,
    })
  })

  it('rejects when the person does not exist', async () => {
    const { useCase } = makeSut()

    await expect(useCase.execute({ id: 'missing-id' })).rejects.toThrow(PersonNotFoundError)
  })
})
