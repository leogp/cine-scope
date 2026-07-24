import { UseCase } from '@cinescope/shared/application'
import { GenreNotFoundError } from '../../../../domain/errors/genreNotFoundError'
import { GenreRepository } from '../../../../domain/repositories/genreRepository'
import { GetGenreRequest } from './getGenreRequest'
import { GetGenreResponse } from './getGenreResponse'

export class GetGenreUseCase implements UseCase<GetGenreRequest, GetGenreResponse> {
  constructor(private readonly genreRepository: GenreRepository) {}

  async execute(request: GetGenreRequest): Promise<GetGenreResponse> {
    const genre = await this.genreRepository.findById(request.id)

    if (!genre) {
      throw new GenreNotFoundError()
    }

    const { name, createdAt, updatedAt } = genre.data

    return {
      id: genre.id,
      name: name.value,
      createdAt,
      updatedAt,
    }
  }
}
