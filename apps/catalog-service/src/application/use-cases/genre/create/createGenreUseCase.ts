import { UseCase } from '@cinescope/shared/application'
import { Genre } from '../../../../domain/entities/genre'
import { GenreRepository } from '../../../../domain/repositories/genreRepository'
import { GenreName } from '../../../../domain/value-objects/genreName'
import { CreateGenreRequest } from './createGenreRequest'
import { CreateGenreResponse } from './createGenreResponse'

export class CreateGenreUseCase implements UseCase<CreateGenreRequest, CreateGenreResponse> {
  constructor(private readonly genreRepository: GenreRepository) {}

  async execute(request: CreateGenreRequest): Promise<CreateGenreResponse> {
    const name = new GenreName(request.name)

    const genre = Genre.create({ name })

    await this.genreRepository.save(genre)

    return {
      id: genre.id,
    }
  }
}
