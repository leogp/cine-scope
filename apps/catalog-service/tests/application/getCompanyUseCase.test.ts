import { GetCompanyUseCase } from '../../src/application/use-cases/company/get/getCompanyUseCase'
import { CompanyNotFoundError } from '../../src/domain/errors/companyNotFoundError'
import { InMemoryCompanyRepository } from '../fakes/inMemoryCompanyRepository'
import { buildCompany } from '../helpers/builders'

const makeSut = () => {
  const companyRepository = new InMemoryCompanyRepository()
  const useCase = new GetCompanyUseCase(companyRepository)

  return { useCase, companyRepository }
}

describe('GetCompanyUseCase', () => {
  it('returns the company with value objects unwrapped to primitives', async () => {
    const { useCase, companyRepository } = makeSut()
    const company = buildCompany()
    await companyRepository.save(company)

    const response = await useCase.execute({ id: company.id })

    expect(response).toEqual({
      id: company.id,
      name: 'A24',
      logoPath: null,
      countryCode: 'US',
      createdAt: company.data.createdAt,
      updatedAt: company.data.updatedAt,
    })
  })

  it('rejects when the company does not exist', async () => {
    const { useCase, companyRepository } = makeSut()

    await expect(useCase.execute({ id: 'missing-id' })).rejects.toThrow(CompanyNotFoundError)
    expect(companyRepository.size).toBe(0)
  })
})
