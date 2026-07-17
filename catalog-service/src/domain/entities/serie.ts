export interface SeriesProps {
  id: string
  title: MovieTitle
  overview: string | null
  firstAirDate: Date | null
  lastAirDate: Date | null
  originalLanguage: LanguageCode
  posterPath: string | null
  backdropPath: string | null
  genres: Genre[]
  cast: Person[]
  directors: Person[]
  productionCompanies: Company[]
  externalReferences: ExternalReference[]
  createdAt: Date
  updatedAt: Date
}

export type CreateSeriesProps = Omit<SeriesProps, 'id' | 'createdAt' | 'updatedAt'>

export class Series {
  private constructor(private readonly props: SeriesProps) {}

  static create(props: CreateSeriesProps): Series {
    return new Series({
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...props,
    })
  }

  static restore(props: SeriesProps): Series {
    return new Series(props)
  }

  get data(): Readonly<SeriesProps> {
    return this.props
  }

  changeTitle(title: MovieTitle): void {
    this.props.title = title
    this.touch()
  }

  private touch(): void {
    this.props.updatedAt = new Date()
  }
}
