import { Company } from '../entities/company'

export interface CompanyRepository {
  findById(id: string): Promise<Company | null>

  save(company: Company): Promise<void>

  exists(id: string): Promise<boolean>

  delete(id: string): Promise<void>
}
