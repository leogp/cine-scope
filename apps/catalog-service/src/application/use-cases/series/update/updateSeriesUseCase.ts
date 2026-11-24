import { UseCase } from '@cinescope/shared/application'
import { CompanyNotFoundError } from '@catalog/domain/errors/companyNotFoundError'
import { GenreNotFoundError } from '@catalog/domain/errors/genreNotFoundError'
import { PersonNotFoundError } from '@catalog/domain/errors/personNotFoundError'
import { SeriesNotFoundError } from '@catalog/domain/errors/seriesNotFoundError'
import { CompanyRepository } from '@catalog/domain/repositories/companyRepository'
import { GenreRepository } from '@catalog/domain/repositories/genreRepository'
import { PersonRepository } from '@catalog/domain/repositories/personRepository'
import { SeriesRepository } from '@catalog/domain/repositories/seriesRepository'
import { LanguageCode } from '@catalog/domain/value-objects/languageCode'
import { Title } from '@catalog/domain/value-objects/title'
import { resolveByIds } from '@catalog/application/use-cases/shared/resolveByIds'
import { UpdateSeriesRequest } from './updateSeriesRequest'
import { UpdateSeriesResponse } from './updateSeriesResponse'

export class UpdateSeriesUseCase implements UseCase<UpdateSeriesRequest, UpdateSeriesResponse> {
  constructor(
    private readonly seriesRepository: SeriesRepository,
    private readonly genreRepository: GenreRepository,
    private readonly personRepository: PersonRepository,
    private readonly companyRepository: CompanyRepository
  ) {}

  async execute(request: UpdateSeriesRequest): Promise<UpdateSeriesResponse> {
    const series = await this.seriesRepository.findById(request.id)

    if (!series) {
      throw new SeriesNotFoundError()
    }

    const title = new Title(request.title)
    const originalLanguage = new LanguageCode(request.originalLanguage)

    const [genres, cast, directors, productionCompanies] = await Promise.all([
      resolveByIds(request.genreIds, this.genreRepository, () => new GenreNotFoundError()),
      resolveByIds(request.castIds, this.personRepository, () => new PersonNotFoundError()),
      resolveByIds(request.directorIds, this.personRepository, () => new PersonNotFoundError()),
      resolveByIds(request.companyIds, this.companyRepository, () => new CompanyNotFoundError()),
    ])

    series.changeTitle(title)
    series.changeOverview(request.overview)
    series.changeFirstAirDate(request.firstAirDate)
    series.changeLastAirDate(request.lastAirDate)
    series.changeOriginalLanguage(originalLanguage)
    series.changePosterPath(request.posterPath)
    series.changeBackdropPath(request.backdropPath)
    series.setGenres(genres)
    series.setCast(cast)
    series.setDirectors(directors)
    series.setProductionCompanies(productionCompanies)

    await this.seriesRepository.save(series)

    return {
      id: series.id,
    }
  }
}
