import { Company, CompanyProps } from '@catalog/domain/entities/company'
import { CompanyName } from '@catalog/domain/value-objects/companyName'
import { CountryCode } from '@catalog/domain/value-objects/countryCode'

const buildProps = (overrides: Partial<CompanyProps> = {}): CompanyProps => ({
  id: 'company-1',
  name: new CompanyName('A24'),
  logoPath: null,
  countryCode: new CountryCode('US'),
  createdAt: new Date('2020-01-01T00:00:00Z'),
  updatedAt: new Date('2020-01-01T00:00:00Z'),
  ...overrides,
})

describe('Company', () => {
  describe('create', () => {
    it('generates an id and timestamps', () => {
      const company = Company.create({
        name: new CompanyName('Neon'),
        logoPath: null,
        countryCode: null,
      })

      expect(company.id).toEqual(expect.any(String))
      expect(company.id).not.toBe('')
      expect(company.data.createdAt).toBeInstanceOf(Date)
      expect(company.data.name.value).toBe('Neon')
    })

    it('allows a null country code', () => {
      const company = Company.create({
        name: new CompanyName('Neon'),
        logoPath: null,
        countryCode: null,
      })

      expect(company.data.countryCode).toBeNull()
    })
  })

  describe('restore', () => {
    it('preserves the supplied id and timestamps', () => {
      const props = buildProps()
      const company = Company.restore(props)

      expect(company.id).toBe('company-1')
      expect(company.data.countryCode?.value).toBe('US')
      expect(company.data.createdAt).toBe(props.createdAt)
    })
  })

  describe('rename', () => {
    it('replaces the name and refreshes updatedAt', () => {
      const company = Company.restore(buildProps())

      company.rename(new CompanyName('Focus Features'))

      expect(company.data.name.value).toBe('Focus Features')
      expect(company.data.updatedAt.getTime()).toBeGreaterThan(
        new Date('2020-01-01T00:00:00Z').getTime()
      )
    })
  })
})
