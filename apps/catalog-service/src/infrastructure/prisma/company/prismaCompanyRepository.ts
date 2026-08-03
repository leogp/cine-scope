import { Company } from '../../../domain/entities/company'
import { CompanyRepository } from '../../../domain/repositories/companyRepository'
import { PrismaClient } from '../generated/client'
import { PrismaCompanyMapper } from './prismaCompanyMapper'

export class PrismaCompanyRepository implements CompanyRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<Company | null> {
    const row = await this.prisma.company.findUnique({
      where: { id },
    })

    return row ? PrismaCompanyMapper.toDomain(row) : null
  }

  /**
   * Upsert for the same reason as `PrismaMovieRepository.save`: the port has no
   * separate `update`, so intent cannot be read off the call site and an
   * exists()-then-branch would cost a round trip while still racing on the key.
   */
  async save(company: Company): Promise<void> {
    const { id, ...scalars } = PrismaCompanyMapper.toPersistence(company)

    await this.prisma.company.upsert({
      where: { id },
      create: {
        id,
        ...scalars,
      },
      update: {
        ...scalars,
      },
    })
  }

  async exists(id: string): Promise<boolean> {
    const row = await this.prisma.company.findUnique({ where: { id }, select: { id: true } })

    return row !== null
  }

  /** The join tables cascade on delete, so no manual cleanup is needed. */
  async delete(id: string): Promise<void> {
    await this.prisma.company.delete({ where: { id } })
  }
}
