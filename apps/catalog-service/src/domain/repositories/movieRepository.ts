import { Movie } from '../entities/movie'

export interface MovieRepository {
  findById(id: string): Promise<Movie | null>

  // Neutral primitives on purpose: the domain port must not depend on the
  // application layer's pagination types. The use-case maps the window params
  // in and wraps the { items, total } window into a PaginatedResult out.
  findAll(params: { limit: number; offset: number }): Promise<{ items: Movie[]; total: number }>

  save(movie: Movie): Promise<void>

  exists(id: string): Promise<boolean>

  delete(id: string): Promise<void>
}
