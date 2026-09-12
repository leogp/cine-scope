import { CreatePersonUseCase } from '@catalog/application/use-cases/person/create/createPersonUseCase'
import { InvalidPersonNameError } from '@catalog/domain/errors/invalidPersonNameError'
import { InMemoryPersonRepository } from '../fakes/inMemoryPersonRepository'

const makeSut = () => {
  const personRepository = new InMemoryPersonRepository()
  const useCase = new CreatePersonUseCase(personRepository)

  return { useCase, personRepository }
}

describe('CreatePersonUseCase', () => {
  it('creates a person from the name alone, defaulting the optional fields', async () => {
    const { useCase, personRepository } = makeSut()

    const response = await useCase.execute({ name: 'Greta Gerwig' })

    expect(response.id).toEqual(expect.any(String))

    const saved = await personRepository.findById(response.id)
    expect(saved).not.toBeNull()
    expect(saved!.data.name.value).toBe('Greta Gerwig')
    expect(saved!.data.biography).toBeNull()
    expect(saved!.data.birthDate).toBeNull()
    expect(saved!.data.profilePath).toBeNull()
  })

  it('creates a person with all optional fields', async () => {
    const { useCase, personRepository } = makeSut()
    const birthDate = new Date('1983-08-04')

    const response = await useCase.execute({
      name: 'Greta Gerwig',
      biography: 'American director and screenwriter.',
      birthDate,
      profilePath: '/profiles/greta.png',
    })

    const saved = await personRepository.findById(response.id)
    expect(saved!.data.biography).toBe('American director and screenwriter.')
    expect(saved!.data.birthDate).toBe(birthDate)
    expect(saved!.data.profilePath).toBe('/profiles/greta.png')
  })

  it('rejects an invalid name and saves nothing', async () => {
    const { useCase, personRepository } = makeSut()

    await expect(useCase.execute({ name: '' })).rejects.toThrow(InvalidPersonNameError)
    expect(personRepository.size).toBe(0)
  })
})
