import { Person } from '../../../domain/entities/person'
import { PersonRepository } from '../../../domain/repositories/personRepository'
import { PrismaClient } from '../generated/client'
import { PrismaPersonMapper } from './prismaPersonMapper'

export class PrismaPersonRepository implements PersonRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<Person | null> {
    const row = await this.prisma.person.findUnique({
      where: { id },
    })

    return row ? PrismaPersonMapper.toDomain(row) : null
  }

  /**
   * Upsert for the same reason as `PrismaMovieRepository.save`: the port has no
   * separate `update`, so intent cannot be read off the call site and an
   * exists()-then-branch would cost a round trip while still racing on the key.
   */
  async save(person: Person): Promise<void> {
    const { id, ...scalars } = PrismaPersonMapper.toPersistence(person)

    await this.prisma.person.upsert({
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
    const row = await this.prisma.person.findUnique({ where: { id }, select: { id: true } })

    return row !== null
  }

  /** The join tables cascade on delete, so no manual cleanup is needed. */
  async delete(id: string): Promise<void> {
    await this.prisma.person.delete({ where: { id } })
  }
}
