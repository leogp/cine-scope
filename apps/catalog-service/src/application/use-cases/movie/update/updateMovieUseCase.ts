import { UseCase } from '@cinescope/shared/application'
import { CompanyNotFoundError } from '../../../../domain/errors/companyNotFoundError'
import { GenreNotFoundError } from '../../../../domain/errors/genreNotFoundError'
import { MovieNotFoundError } from '../../../../domain/errors/movieNotFoundError'
import { PersonNotFoundError } from '../../../../domain/errors/personNotFoundError'
import { CompanyRepository } from '../../../../domain/repositories/companyRepository'
import { GenreRepository } from '../../../../domain/repositories/genreRepository'
import { MovieRepository } from '../../../../domain/repositories/movieRepository'
import { PersonRepository } from '../../../../domain/repositories/personRepository'
import { Duration } from '../../../../domain/value-objects/duration'
import { LanguageCode } from '../../../../domain/value-objects/languageCode'
import { MovieTitle } from '../../../../domain/value-objects/movieTitle'
import { resolveByIds } from '../shared/resolveByIds'
import { UpdateMovieRequest } from './updateMovieRequest'
import { UpdateMovieResponse } from './updateMovieResponse'

export class UpdateMovieUseCase implements UseCase<UpdateMovieRequest, UpdateMovieResponse> {
  constructor(
    private readonly movieRepository: MovieRepository,
    private readonly genreRepository: GenreRepository,
    private readonly personRepository: PersonRepository,
    private readonly companyRepository: CompanyRepository
  ) {}

  async execute(request: UpdateMovieRequest): Promise<UpdateMovieResponse> {
    const movie = await this.movieRepository.findById(request.id)

    if (!movie) {
      throw new MovieNotFoundError()
    }

    const title = new MovieTitle(request.title)
    const originalLanguage = new LanguageCode(request.originalLanguage)
    const duration = request.duration !== null ? Duration.create(request.duration) : null

    const [genres, cast, directors, productionCompanies] = await Promise.all([
      resolveByIds(request.genreIds, this.genreRepository, () => new GenreNotFoundError()),
      resolveByIds(request.castIds, this.personRepository, () => new PersonNotFoundError()),
      resolveByIds(request.directorIds, this.personRepository, () => new PersonNotFoundError()),
      resolveByIds(request.companyIds, this.companyRepository, () => new CompanyNotFoundError()),
    ])

    movie.changeTitle(title)
    movie.changeOverview(request.overview)
    movie.changeReleaseDate(request.releaseDate)
    movie.changeDuration(duration)
    movie.changeOriginalLanguage(originalLanguage)
    movie.changePosterPath(request.posterPath)
    movie.changeBackdropPath(request.backdropPath)
    movie.setGenres(genres)
    movie.setCast(cast)
    movie.setDirectors(directors)
    movie.setProductionCompanies(productionCompanies)

    await this.movieRepository.save(movie)

    return {
      id: movie.id,
    }
  }
}
