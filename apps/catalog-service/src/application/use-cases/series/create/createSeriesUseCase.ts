import { UseCase } from '@cinescope/shared/application'
// entities & value objects
import { Series } from '@catalog/domain/entities/series'
import { LanguageCode } from '@catalog/domain/value-objects/languageCode'
import { MovieTitle } from '@catalog/domain/value-objects/movieTitle'
import { resolveByIds } from '@catalog/application/use-cases/shared/resolveByIds'
// repositories
import { CompanyRepository } from '@catalog/domain/repositories/companyRepository'
import { PersonRepository } from '@catalog/domain/repositories/personRepository'
import { GenreRepository } from '@catalog/domain/repositories/genreRepository'
import { SeriesRepository } from '@catalog/domain/repositories/seriesRepository'
// request & response
import { CreateSeriesRequest } from './createSeriesRequest'
import { CreateSeriesResponse } from './createSeriesResponse'
// errors
import { CompanyNotFoundError } from '@catalog/domain/errors/companyNotFoundError'
import { GenreNotFoundError } from '@catalog/domain/errors/genreNotFoundError'
import { PersonNotFoundError } from '@catalog/domain/errors/personNotFoundError'

export class CreateSeriesUseCase implements UseCase<CreateSeriesRequest, CreateSeriesResponse> {
  constructor(
    private readonly seriesRepository: SeriesRepository,
    private readonly genreRepository: GenreRepository,
    private readonly personRepository: PersonRepository,
    private readonly companyRepository: CompanyRepository
  ) {}

  async execute(request: CreateSeriesRequest): Promise<CreateSeriesResponse> {
    const title = new MovieTitle(request.title)
    const originalLanguage = new LanguageCode(request.originalLanguage)

    const [genres, cast, directors, productionCompanies] = await Promise.all([
      resolveByIds(request.genreIds, this.genreRepository, () => new GenreNotFoundError()),
      resolveByIds(request.castIds, this.personRepository, () => new PersonNotFoundError()),
      resolveByIds(request.directorIds, this.personRepository, () => new PersonNotFoundError()),
      resolveByIds(request.companyIds, this.companyRepository, () => new CompanyNotFoundError()),
    ])

    const series = Series.create({
      title,
      overview: request.overview,
      firstAirDate: request.firstAirDate,
      lastAirDate: request.lastAirDate,
      originalLanguage,
      posterPath: request.posterPath,
      backdropPath: request.backdropPath,
      genres,
      cast,
      directors,
      productionCompanies,
    })

    await this.seriesRepository.save(series)

    return {
      id: series.id,
    }
  }
}
