import { CreateCompanyUseCase } from '../../src/application/use-cases/company/create/createCompanyUseCase'
import { InvalidCompanyNameError } from '../../src/domain/errors/invalidCompanyNameError'
import { InvalidCountryCodeError } from '../../src/domain/errors/invalidCountryCodeError'
import { InMemoryCompanyRepository } from '../fakes/inMemoryCompanyRepository'

const makeSut = () => {
  const companyRepository = new InMemoryCompanyRepository()
  const useCase = new CreateCompanyUseCase(companyRepository)

  return { useCase, companyRepository }
}

describe('CreateCompanyUseCase', () => {
  it('creates a company from the name alone, defaulting the optional fields', async () => {
    const { useCase, companyRepository } = makeSut()

    const response = await useCase.execute({ name: 'A24' })

    expect(response.id).toEqual(expect.any(String))

    const saved = await companyRepository.findById(response.id)
    expect(saved).not.toBeNull()
    expect(saved!.data.name.value).toBe('A24')
    expect(saved!.data.logoPath).toBeNull()
    expect(saved!.data.countryCode).toBeNull()
  })

  it('creates a company with logo and country', async () => {
    const { useCase, companyRepository } = makeSut()

    const response = await useCase.execute({
      name: 'A24',
      logoPath: '/logos/a24.png',
      countryCode: 'US',
    })

    const saved = await companyRepository.findById(response.id)
    expect(saved!.data.logoPath).toBe('/logos/a24.png')
    expect(saved!.data.countryCode?.value).toBe('US')
  })

  it('rejects an invalid name and saves nothing', async () => {
    const { useCase, companyRepository } = makeSut()

    await expect(useCase.execute({ name: '' })).rejects.toThrow(InvalidCompanyNameError)
    expect(companyRepository.size).toBe(0)
  })

  it('rejects an invalid country code and saves nothing', async () => {
    const { useCase, companyRepository } = makeSut()

    await expect(useCase.execute({ name: 'A24', countryCode: 'usa' })).rejects.toThrow(
      InvalidCountryCodeError
    )
    expect(companyRepository.size).toBe(0)
  })
})
