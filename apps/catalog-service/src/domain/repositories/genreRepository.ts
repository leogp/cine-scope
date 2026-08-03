import { Genre } from '../entities/genre'

export interface GenreRepository {
  findById(id: string): Promise<Genre | null>

  /** Genre names are unique, so this resolves at most one genre. */
  findByName(name: string): Promise<Genre | null>

  save(genre: Genre): Promise<void>

  exists(id: string): Promise<boolean>

  delete(id: string): Promise<void>
}
