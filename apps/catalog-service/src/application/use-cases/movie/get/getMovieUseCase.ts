import { UseCase } from '@cinescope/shared/application'
import { MovieNotFoundError } from '../../../../domain/errors/movieNotFoundError'
import { MovieRepository } from '../../../../domain/repositories/movieRepository'
import { toMovieDTO } from '../shared/movieMappers'
import { GetMovieRequest } from './getMovieRequest'
import { GetMovieResponse } from './getMovieResponse'

export class GetMovieUseCase implements UseCase<GetMovieRequest, GetMovieResponse> {
  constructor(private readonly movieRepository: MovieRepository) {}

  async execute(request: GetMovieRequest): Promise<GetMovieResponse> {
    const movie = await this.movieRepository.findById(request.id)

    if (!movie) {
      throw new MovieNotFoundError()
    }

    return toMovieDTO(movie)
  }
}
