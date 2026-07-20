import { Movie } from '../entities/movie'

export interface MovieRepository {
  findById(id: string): Promise<Movie | null>

  save(movie: Movie): Promise<void>

  exists(id: string): Promise<boolean>

  delete(id: string): Promise<void>
}
