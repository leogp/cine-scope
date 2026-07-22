import { UseCase } from '@cinescope/shared/application'
import { CompanyNotFoundError } from '../../../../domain/errors/companyNotFoundError'
import { CompanyRepository } from '../../../../domain/repositories/companyRepository'
import { GetCompanyRequest } from './getCompanyRequest'
import { GetCompanyResponse } from './getCompanyResponse'

export class GetCompanyUseCase implements UseCase<GetCompanyRequest, GetCompanyResponse> {
  constructor(private readonly companyRepository: CompanyRepository) {}

  async execute(request: GetCompanyRequest): Promise<GetCompanyResponse> {
    const company = await this.companyRepository.findById(request.id)

    if (!company) {
      throw new CompanyNotFoundError()
    }

    const { name, logoPath, countryCode, createdAt, updatedAt } = company.data

    return {
      id: company.id,
      name: name.value,
      logoPath,
      countryCode: countryCode?.value ?? null,
      createdAt,
      updatedAt,
    }
  }
}
