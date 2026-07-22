import { Company } from '../../src/domain/entities/company'
import { CompanyRepository } from '../../src/domain/repositories/companyRepository'

export class InMemoryCompanyRepository implements CompanyRepository {
  private readonly companies = new Map<string, Company>()

  get size(): number {
    return this.companies.size
  }

  async findById(id: string): Promise<Company | null> {
    return this.companies.get(id) ?? null
  }

  async save(company: Company): Promise<void> {
    this.companies.set(company.id, company)
  }

  async exists(id: string): Promise<boolean> {
    return this.companies.has(id)
  }

  async delete(id: string): Promise<void> {
    this.companies.delete(id)
  }
}
