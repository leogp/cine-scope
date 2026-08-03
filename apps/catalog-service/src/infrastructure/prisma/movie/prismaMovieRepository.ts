import { Movie } from '../../../domain/entities/movie'
import { MovieRepository } from '../../../domain/repositories/movieRepository'
import { PrismaClient } from '../generated/client'
import { PrismaMovieMapper } from './prismaMovieMapper'

/**
 * Rehydrating a full Movie loads all four join tables plus their related
 * rows — toMovieDTO renders every one of them.
 */
const movieWithRelationsInclude = {
  genres: { include: { genre: true } },
  cast: { include: { person: true } },
  directors: { include: { person: true } },
  productionCompanies: { include: { company: true } },
} as const

export class PrismaMovieRepository implements MovieRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<Movie | null> {
    const row = await this.prisma.movie.findUnique({
      where: { id },
      include: movieWithRelationsInclude,
    })

    return row ? PrismaMovieMapper.toDomain(row) : null
  }

  /**
   * Relations are deliberately not loaded: the list read model
   * (toMovieSummaryDTO) discards them, so including four joins per row would
   * fan out hundreds of rows to build objects that are thrown away.
   *
   * The id tiebreaker matters — createdAt alone is not unique, and OFFSET
   * pagination over a non-deterministic order repeats and skips rows.
   */
  async findAll(params: { limit: number; offset: number }): Promise<{
    items: Movie[]
    total: number
  }> {
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.movie.findMany({
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        skip: params.offset,
        take: params.limit,
      }),
      this.prisma.movie.count(),
    ])

    return { items: rows.map((row) => PrismaMovieMapper.toDomain(row)), total }
  }

  /**
   * Upsert rather than an exists()-then-branch: the port exposes no separate
   * `update`, so the repository cannot learn intent from the call site, and a
   * pre-check would cost a round trip while still racing on the primary key.
   *
   * No explicit $transaction — Prisma already wraps a top-level write and its
   * nested writes in one transaction.
   */
  async save(movie: Movie): Promise<void> {
    const { id, ...scalars } = PrismaMovieMapper.toPersistence(movie)
    const relations = PrismaMovieMapper.toRelationWrites(movie)

    await this.prisma.movie.upsert({
      where: { id },
      create: {
        id,
        ...scalars,
        genres: { create: relations.genres },
        cast: { create: relations.cast },
        directors: { create: relations.directors },
        productionCompanies: { create: relations.productionCompanies },
      },
      update: {
        ...scalars,
        // Replace the join sets with the aggregate's current state — the
        // set* methods are full replacements. deleteMany is implicitly scoped
        // to this movie's rows.
        genres: { deleteMany: {}, create: relations.genres },
        cast: { deleteMany: {}, create: relations.cast },
        directors: { deleteMany: {}, create: relations.directors },
        productionCompanies: { deleteMany: {}, create: relations.productionCompanies },
      },
    })
  }

  async exists(id: string): Promise<boolean> {
    const row = await this.prisma.movie.findUnique({ where: { id }, select: { id: true } })

    return row !== null
  }

  /** The join tables cascade on delete, so no manual cleanup is needed. */
  async delete(id: string): Promise<void> {
    await this.prisma.movie.delete({ where: { id } })
  }
}
