import { UseCase } from '@cinescope/shared/application'
import { Company } from '../../../../domain/entities/company'
import { CompanyRepository } from '../../../../domain/repositories/companyRepository'
import { CompanyName } from '../../../../domain/value-objects/companyName'
import { CountryCode } from '../../../../domain/value-objects/countryCode'
import { CreateCompanyRequest } from './createCompanyRequest'
import { CreateCompanyResponse } from './createCompanyResponse'

export class CreateCompanyUseCase implements UseCase<CreateCompanyRequest, CreateCompanyResponse> {
  constructor(private readonly companyRepository: CompanyRepository) {}

  async execute(request: CreateCompanyRequest): Promise<CreateCompanyResponse> {
    const name = new CompanyName(request.name)
    const countryCode = request.countryCode ? new CountryCode(request.countryCode) : null

    const company = Company.create({
      name,
      logoPath: request.logoPath ?? null,
      countryCode,
    })

    await this.companyRepository.save(company)

    return {
      id: company.id,
    }
  }
}
