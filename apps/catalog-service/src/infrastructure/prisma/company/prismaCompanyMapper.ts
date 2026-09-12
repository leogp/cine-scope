import { Company } from '@catalog/domain/entities/company'
import { CompanyName } from '@catalog/domain/value-objects/companyName'
import { CountryCode } from '@catalog/domain/value-objects/countryCode'
import { CompanyModel } from '../generated/models'

export type CompanyRow = CompanyModel

export interface CompanyPersistence {
  id: string
  name: string
  logoPath: string | null
  countryCode: string | null
  createdAt: Date
  updatedAt: Date
}

export class PrismaCompanyMapper {
  static toDomain(row: CompanyRow): Company {
    return Company.restore({
      id: row.id,
      name: new CompanyName(row.name),
      logoPath: row.logoPath,
      // Nullable column ↔ optional value object: only construct the VO when a
      // value is present, so its invariants never run against `null`.
      countryCode: row.countryCode !== null ? new CountryCode(row.countryCode) : null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    })
  }

  static toPersistence(company: Company): CompanyPersistence {
    return {
      id: company.id,
      name: company.data.name.value,
      logoPath: company.data.logoPath,
      countryCode: company.data.countryCode?.value ?? null,
      createdAt: company.data.createdAt,
      updatedAt: company.data.updatedAt,
    }
  }
}
