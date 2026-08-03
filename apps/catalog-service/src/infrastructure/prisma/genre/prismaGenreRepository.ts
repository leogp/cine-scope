import { Genre } from '@catalog/domain/entities/genre'
import { GenreRepository } from '@catalog/domain/repositories/genreRepository'
import { PrismaClient } from '../generated/client'
import { PrismaGenreMapper } from './prismaGenreMapper'

export class PrismaGenreRepository implements GenreRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<Genre | null> {
    const row = await this.prisma.genre.findUnique({
      where: { id },
    })

    return row ? PrismaGenreMapper.toDomain(row) : null
  }

  async findByName(name: string): Promise<Genre | null> {
    const row = await this.prisma.genre.findUnique({
      where: { name },
    })

    return row ? PrismaGenreMapper.toDomain(row) : null
  }

  /**
   * Upsert for the same reason as `PrismaMovieRepository.save`: the port has no
   * separate `update`, so intent cannot be read off the call site and an
   * exists()-then-branch would cost a round trip while still racing on the key.
   */
  async save(genre: Genre): Promise<void> {
    const { id, ...scalars } = PrismaGenreMapper.toPersistence(genre)

    await this.prisma.genre.upsert({
      where: { id },
      create: {
        id,
        ...scalars,
      },
      update: {
        ...scalars,
      },
    })
  }

  async exists(id: string): Promise<boolean> {
    const row = await this.prisma.genre.findUnique({ where: { id }, select: { id: true } })

    return row !== null
  }

  /** The join tables cascade on delete, so no manual cleanup is needed. */
  async delete(id: string): Promise<void> {
    await this.prisma.genre.delete({ where: { id } })
  }
}
