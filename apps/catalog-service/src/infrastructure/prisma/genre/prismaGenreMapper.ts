import { Genre } from '../../../domain/entities/genre'
import { GenreName } from '../../../domain/value-objects/genreName'
import { GenreModel } from '../generated/models'

export type GenreRow = GenreModel

export interface GenrePersistence {
  id: string
  name: string
  createdAt: Date
  updatedAt: Date
}

export class PrismaGenreMapper {
  /**
   * `restore`, not `create`: the entity factories mint a fresh id and
   * timestamps, which would discard the row's identity. This holds for every
   * mapper in this service.
   */
  static toDomain(row: GenreRow): Genre {
    return Genre.restore({
      id: row.id,
      name: new GenreName(row.name),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    })
  }

  static toPersistence(genre: Genre): GenrePersistence {
    return {
      id: genre.id,
      name: genre.data.name.value,
      createdAt: genre.data.createdAt,
      updatedAt: genre.data.updatedAt,
    }
  }
}
