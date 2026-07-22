import { AggregateRoot, EntityProps } from '@cinescope/shared/domain'
import { CompanyName } from '../value-objects/companyName'
import { CountryCode } from '../value-objects/countryCode'

export interface CompanyProps extends EntityProps {
  name: CompanyName
  logoPath: string | null
  countryCode: CountryCode | null
  createdAt: Date
  updatedAt: Date
}

export type CreateCompanyProps = Omit<CompanyProps, 'id' | 'createdAt' | 'updatedAt'>

export class Company extends AggregateRoot<CompanyProps> {
  private constructor(props: CompanyProps) {
    super(props)
  }

  static create(props: CreateCompanyProps): Company {
    return new Company({
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...props,
    })
  }

  static restore(props: CompanyProps): Company {
    return new Company(props)
  }

  rename(name: CompanyName): void {
    this.props.name = name
    this.touch()
  }
}
