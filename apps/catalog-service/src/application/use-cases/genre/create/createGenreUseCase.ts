import { UseCase } from '@cinescope/shared/application'
import { Genre } from '../../../../domain/entities/genre'
import { GenreAlreadyExistsError } from '../../../../domain/errors/genreAlreadyExistsError'
import { GenreRepository } from '../../../../domain/repositories/genreRepository'
import { GenreName } from '../../../../domain/value-objects/genreName'
import { CreateGenreRequest } from './createGenreRequest'
import { CreateGenreResponse } from './createGenreResponse'

export class CreateGenreUseCase implements UseCase<CreateGenreRequest, CreateGenreResponse> {
  constructor(private readonly genreRepository: GenreRepository) {}

  async execute(request: CreateGenreRequest): Promise<CreateGenreResponse> {
    const name = new GenreName(request.name)

    // Genre names carry a unique constraint; without this the raw driver
    // violation would surface as a 500 instead of a conflict.
    const existing = await this.genreRepository.findByName(name.value)

    if (existing) {
      throw new GenreAlreadyExistsError(name.value)
    }

    const genre = Genre.create({ name })

    await this.genreRepository.save(genre)

    return {
      id: genre.id,
    }
  }
}
