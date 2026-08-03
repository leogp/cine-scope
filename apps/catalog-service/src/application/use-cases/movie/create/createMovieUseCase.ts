import { UseCase } from '@cinescope/shared/application'
import { Movie } from '@catalog/domain/entities/movie'
import { CompanyNotFoundError } from '@catalog/domain/errors/companyNotFoundError'
import { GenreNotFoundError } from '@catalog/domain/errors/genreNotFoundError'
import { PersonNotFoundError } from '@catalog/domain/errors/personNotFoundError'
import { CompanyRepository } from '@catalog/domain/repositories/companyRepository'
import { GenreRepository } from '@catalog/domain/repositories/genreRepository'
import { MovieRepository } from '@catalog/domain/repositories/movieRepository'
import { PersonRepository } from '@catalog/domain/repositories/personRepository'
import { Duration } from '@catalog/domain/value-objects/duration'
import { LanguageCode } from '@catalog/domain/value-objects/languageCode'
import { MovieTitle } from '@catalog/domain/value-objects/movieTitle'
import { resolveByIds } from '@catalog/application/use-cases/shared/resolveByIds'
import { CreateMovieRequest } from './createMovieRequest'
import { CreateMovieResponse } from './createMovieResponse'

export class CreateMovieUseCase implements UseCase<CreateMovieRequest, CreateMovieResponse> {
  constructor(
    private readonly movieRepository: MovieRepository,
    private readonly genreRepository: GenreRepository,
    private readonly personRepository: PersonRepository,
    private readonly companyRepository: CompanyRepository
  ) {}

  async execute(request: CreateMovieRequest): Promise<CreateMovieResponse> {
    const title = new MovieTitle(request.title)
    const originalLanguage = new LanguageCode(request.originalLanguage)
    const duration = request.duration !== null ? Duration.create(request.duration) : null

    const [genres, cast, directors, productionCompanies] = await Promise.all([
      resolveByIds(request.genreIds, this.genreRepository, () => new GenreNotFoundError()),
      resolveByIds(request.castIds, this.personRepository, () => new PersonNotFoundError()),
      resolveByIds(request.directorIds, this.personRepository, () => new PersonNotFoundError()),
      resolveByIds(request.companyIds, this.companyRepository, () => new CompanyNotFoundError()),
    ])

    const movie = Movie.create({
      title,
      overview: request.overview,
      releaseDate: request.releaseDate,
      duration,
      originalLanguage,
      posterPath: request.posterPath,
      backdropPath: request.backdropPath,
      genres,
      cast,
      directors,
      productionCompanies,
    })

    await this.movieRepository.save(movie)

    return {
      id: movie.id,
    }
  }
}
