import { Movie } from '../../src/domain/entities/movie'
import { MovieRepository } from '../../src/domain/repositories/movieRepository'

export class InMemoryMovieRepository implements MovieRepository {
  private readonly movies = new Map<string, Movie>()

  get size(): number {
    return this.movies.size
  }

  async findById(id: string): Promise<Movie | null> {
    return this.movies.get(id) ?? null
  }

  async findAll(params: { limit: number; offset: number }): Promise<{
    items: Movie[]
    total: number
  }> {
    const sorted = [...this.movies.values()].sort(
      (a, b) => a.data.createdAt.getTime() - b.data.createdAt.getTime()
    )

    return {
      items: sorted.slice(params.offset, params.offset + params.limit),
      total: this.movies.size,
    }
  }

  async save(movie: Movie): Promise<void> {
    this.movies.set(movie.id, movie)
  }

  async exists(id: string): Promise<boolean> {
    return this.movies.has(id)
  }

  async delete(id: string): Promise<void> {
    this.movies.delete(id)
  }
}
