export interface CompanyProps {
  id: string
  name: CompanyName
  logoPath: string | null
  countryCode: CountryCode | null
  externalReferences: ExternalReference[]
  createdAt: Date
  updatedAt: Date
}

export type CreateCompanyProps = Omit<CompanyProps, 'id' | 'createdAt' | 'updatedAt'>

export class Company {
  private constructor(private readonly props: CompanyProps) {}

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

  get data(): Readonly<CompanyProps> {
    return this.props
  }

  rename(name: CompanyName): void {
    this.props.name = name
    this.props.updatedAt = new Date()
  }
}
