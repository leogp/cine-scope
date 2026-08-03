import { UseCase } from '@cinescope/shared/application'
import { MovieNotFoundError } from '@catalog/domain/errors/movieNotFoundError'
import { MovieRepository } from '@catalog/domain/repositories/movieRepository'
import { DeleteMovieRequest } from './deleteMovieRequest'
import { DeleteMovieResponse } from './deleteMovieResponse'

export class DeleteMovieUseCase implements UseCase<DeleteMovieRequest, DeleteMovieResponse> {
  constructor(private readonly movieRepository: MovieRepository) {}

  async execute(request: DeleteMovieRequest): Promise<DeleteMovieResponse> {
    const exists = await this.movieRepository.exists(request.id)

    if (!exists) {
      throw new MovieNotFoundError()
    }

    await this.movieRepository.delete(request.id)
  }
}
