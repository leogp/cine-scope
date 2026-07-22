import { Company, CreateCompanyProps } from '../../src/domain/entities/company'
import { CompanyName } from '../../src/domain/value-objects/companyName'
import { CountryCode } from '../../src/domain/value-objects/countryCode'

export const buildCompany = (overrides: Partial<CreateCompanyProps> = {}): Company =>
  Company.create({
    name: new CompanyName('A24'),
    logoPath: null,
    countryCode: new CountryCode('US'),
    ...overrides,
  })
