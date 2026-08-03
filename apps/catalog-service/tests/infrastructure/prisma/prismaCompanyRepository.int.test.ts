import { CompanyName } from '@catalog/domain/value-objects/companyName'
import { PrismaCompanyRepository } from '@catalog/infrastructure/prisma/company'
import { buildCompany } from '../../helpers/builders'
import { createTestPrisma, truncateAll } from '../../helpers/testDb'

const prisma = createTestPrisma()
const companyRepository = new PrismaCompanyRepository(prisma)

beforeEach(async () => {
  await truncateAll(prisma)
})

afterAll(async () => {
  await prisma.$disconnect()
})

describe('PrismaCompanyRepository', () => {
  it('saves a company and rehydrates it by id', async () => {
    const company = buildCompany()

    await companyRepository.save(company)
    const found = await companyRepository.findById(company.id)

    expect(found).not.toBeNull()
    expect(found!.id).toBe(company.id)
    expect(found!.data.name.value).toBe('A24')
    expect(found!.data.countryCode!.value).toBe('US')
    expect(found!.data.logoPath).toBeNull()
  })

  // The column is `@db.Char(2)`, which Postgres blank-pads — a naive read
  // would rehydrate 'US ' and fail CountryCode's ISO-3166 check.
  it('rehydrates a country code without padding from the CHAR(2) column', async () => {
    const company = buildCompany()
    await companyRepository.save(company)

    const found = await companyRepository.findById(company.id)

    expect(found!.data.countryCode!.value).toHaveLength(2)
  })

  it('round-trips a null country code', async () => {
    const company = buildCompany({ countryCode: null })

    await companyRepository.save(company)
    const found = await companyRepository.findById(company.id)

    expect(found!.data.countryCode).toBeNull()
  })

  it('returns null for an unknown id', async () => {
    expect(await companyRepository.findById('missing')).toBeNull()
  })

  it('overwrites an existing row on a second save', async () => {
    const company = buildCompany()
    await companyRepository.save(company)

    company.rename(new CompanyName('Neon'))
    await companyRepository.save(company)

    const found = await companyRepository.findById(company.id)
    expect(found!.data.name.value).toBe('Neon')
    expect(await prisma.company.count()).toBe(1)
  })

  it('reports existence without rehydrating', async () => {
    const company = buildCompany()
    await companyRepository.save(company)

    expect(await companyRepository.exists(company.id)).toBe(true)
    expect(await companyRepository.exists('missing')).toBe(false)
  })

  it('deletes a company', async () => {
    const company = buildCompany()
    await companyRepository.save(company)

    await companyRepository.delete(company.id)

    expect(await companyRepository.findById(company.id)).toBeNull()
  })
})
