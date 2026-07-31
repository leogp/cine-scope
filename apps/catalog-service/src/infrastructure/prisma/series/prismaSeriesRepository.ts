import { Series } from '../../../domain/entities/series'
import { SeriesRepository } from '../../../domain/repositories/seriesRepository'
import { PrismaClient } from '../generated/client'
import { PrismaSeriesMapper } from './prismaSeriesMapper'

/**
 * Rehydrating a full Series loads all four join tables plus their related
 * rows — toSeriesDTO renders every one of them.
 */
const seriesWithRelationsInclude = {
  genres: { include: { genre: true } },
  cast: { include: { person: true } },
  directors: { include: { person: true } },
  productionCompanies: { include: { company: true } },
} as const

export class PrismaSeriesRepository implements SeriesRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<Series | null> {
    const row = await this.prisma.series.findUnique({
      where: { id },
      include: seriesWithRelationsInclude,
    })

    return row ? PrismaSeriesMapper.toDomain(row) : null
  }

  /**
   * Upsert rather than an exists()-then-branch: the port exposes no separate
   * `update`, so the repository cannot learn intent from the call site, and a
   * pre-check would cost a round trip while still racing on the primary key.
   *
   * No explicit $transaction — Prisma already wraps a top-level write and its
   * nested writes in one transaction.
   */
  async save(series: Series): Promise<void> {
    const { id, ...scalars } = PrismaSeriesMapper.toPersistence(series)
    const relations = PrismaSeriesMapper.toRelationWrites(series)

    await this.prisma.series.upsert({
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
        // to this series's rows.
        genres: { deleteMany: {}, create: relations.genres },
        cast: { deleteMany: {}, create: relations.cast },
        directors: { deleteMany: {}, create: relations.directors },
        productionCompanies: { deleteMany: {}, create: relations.productionCompanies },
      },
    })
  }

  async exists(id: string): Promise<boolean> {
    const row = await this.prisma.series.findUnique({ where: { id }, select: { id: true } })

    return row !== null
  }

  /** The join tables cascade on delete, so no manual cleanup is needed. */
  async delete(id: string): Promise<void> {
    await this.prisma.series.delete({ where: { id } })
  }
}
