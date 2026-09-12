import { Movie } from '@catalog/domain/entities/movie'
import { Duration } from '@catalog/domain/value-objects/duration'
import { LanguageCode } from '@catalog/domain/value-objects/languageCode'
import { MovieTitle } from '@catalog/domain/value-objects/movieTitle'
import { CompanyRow, PrismaCompanyMapper } from '../company/prismaCompanyMapper'
import { GenreRow, PrismaGenreMapper } from '../genre/prismaGenreMapper'
import { MovieModel } from '../generated/models'
import { PersonRow, PrismaPersonMapper } from '../person/prismaPersonMapper'

/**
 * Movie scalars plus, when the repository chose to load them, the four join
 * tables with their related rows.
 *
 * The relation keys are optional, so a row without them collapses to empty
 * arrays in `toDomain` — "not loaded" and "genuinely empty" are therefore
 * indistinguishable. That is safe only because the single relation-less read
 * path is `findAll`, whose results are rendered by `toMovieSummaryDTO`, which
 * discards all four collections.
 */
export type MovieRow = MovieModel & {
  genres?: { genre: GenreRow }[]
  cast?: { person: PersonRow }[]
  directors?: { person: PersonRow }[]
  productionCompanies?: { company: CompanyRow }[]
}

export interface MoviePersistence {
  id: string
  title: string
  overview: string | null
  // Calendar date, not an instant: the column is `@db.Date`, so Postgres
  // truncates using the UTC representation of whatever Date it is given.
  releaseDate: Date | null
  duration: number | null
  originalLanguage: string
  posterPath: string | null
  backdropPath: string | null
  createdAt: Date
  updatedAt: Date
}

export interface MovieRelationWrites {
  genres: { genreId: string }[]
  cast: { personId: string }[]
  directors: { personId: string }[]
  productionCompanies: { companyId: string }[]
}

const uniqueIds = (entities: readonly { id: string }[]): string[] => [
  ...new Set(entities.map((entity) => entity.id)),
]

export class PrismaMovieMapper {
  static toDomain(row: MovieRow): Movie {
    return Movie.restore({
      id: row.id,
      title: new MovieTitle(row.title),
      overview: row.overview,
      releaseDate: row.releaseDate,
      duration: row.duration !== null ? Duration.create(row.duration) : null,
      // No trim despite `@db.Char(2)`: every value written is exactly two
      // chars, so blank padding never occurs and a short code means the row is
      // corrupt — better surfaced as InvalidLanguageCodeError than masked.
      originalLanguage: new LanguageCode(row.originalLanguage),
      posterPath: row.posterPath,
      backdropPath: row.backdropPath,
      genres: row.genres?.map((join) => PrismaGenreMapper.toDomain(join.genre)) ?? [],
      cast: row.cast?.map((join) => PrismaPersonMapper.toDomain(join.person)) ?? [],
      directors: row.directors?.map((join) => PrismaPersonMapper.toDomain(join.person)) ?? [],
      productionCompanies:
        row.productionCompanies?.map((join) => PrismaCompanyMapper.toDomain(join.company)) ?? [],
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    })
  }

  /**
   * Scalar columns only — the join tables are written by the repository
   * through nested writes. `createdAt`/`updatedAt` are included because the
   * aggregate owns them (`touch()` advances `updatedAt`); letting the DB
   * defaults win would drift from the entity the use case just mutated.
   */
  static toPersistence(movie: Movie): MoviePersistence {
    return {
      id: movie.id,
      title: movie.data.title.value,
      overview: movie.data.overview,
      releaseDate: movie.data.releaseDate,
      duration: movie.data.duration?.value ?? null,
      originalLanguage: movie.data.originalLanguage.value,
      posterPath: movie.data.posterPath,
      backdropPath: movie.data.backdropPath,
      createdAt: movie.data.createdAt,
      updatedAt: movie.data.updatedAt,
    }
  }

  /**
   * Join-row payloads for the four relations, deduped by id: `setGenres` and
   * friends accept whatever the request supplied, and repeated ids would
   * violate the join tables' composite primary keys.
   */
  static toRelationWrites(movie: Movie): MovieRelationWrites {
    return {
      genres: uniqueIds(movie.data.genres).map((genreId) => ({ genreId })),
      cast: uniqueIds(movie.data.cast).map((personId) => ({ personId })),
      directors: uniqueIds(movie.data.directors).map((personId) => ({ personId })),
      productionCompanies: uniqueIds(movie.data.productionCompanies).map((companyId) => ({
        companyId,
      })),
    }
  }
}
