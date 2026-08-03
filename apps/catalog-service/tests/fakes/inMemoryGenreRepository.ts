import { Genre } from '@catalog/domain/entities/genre'
import { GenreRepository } from '@catalog/domain/repositories/genreRepository'

export class InMemoryGenreRepository implements GenreRepository {
  private readonly genres = new Map<string, Genre>()

  get size(): number {
    return this.genres.size
  }

  async findById(id: string): Promise<Genre | null> {
    return this.genres.get(id) ?? null
  }

  async findByName(name: string): Promise<Genre | null> {
    return [...this.genres.values()].find((genre) => genre.data.name.value === name) ?? null
  }

  async save(genre: Genre): Promise<void> {
    this.genres.set(genre.id, genre)
  }

  async exists(id: string): Promise<boolean> {
    return this.genres.has(id)
  }

  async delete(id: string): Promise<void> {
    this.genres.delete(id)
  }
}
