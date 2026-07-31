import { Series } from '../../../domain/entities/series'
import { LanguageCode } from '../../../domain/value-objects/languageCode'
import { MovieTitle } from '../../../domain/value-objects/movieTitle'
import { CompanyRow, PrismaCompanyMapper } from '../company/prismaCompanyMapper'
import { GenreRow, PrismaGenreMapper } from '../genre/prismaGenreMapper'
import { SeriesModel } from '../generated/models'
import { PersonRow, PrismaPersonMapper } from '../person/prismaPersonMapper'

/**
 * Series scalars plus the four join tables with their related rows.
 *
 * Unlike `MovieRow` the relation keys are required, not optional: `SeriesRepository`
 * exposes no list read (there is no ListSeries use case), so `findById` — which
 * always includes all four relations — is the only path into `toDomain`. Keeping
 * them required means a future relation-less read fails to compile instead of
 * silently rehydrating a Series with empty collections.
 */
export type SeriesRow = SeriesModel & {
  genres: { genre: GenreRow }[]
  cast: { person: PersonRow }[]
  directors: { person: PersonRow }[]
  productionCompanies: { company: CompanyRow }[]
}

export interface SeriesPersistence {
  id: string
  title: string
  overview: string | null
  // Calendar date, not an instant: the column is `@db.Date`, so Postgres
  // truncates using the UTC representation of whatever Date it is given.
  firstAirDate: Date | null
  lastAirDate: Date | null
  originalLanguage: string
  posterPath: string | null
  backdropPath: string | null
  createdAt: Date
  updatedAt: Date
}

export interface SeriesRelationWrites {
  genres: { genreId: string }[]
  cast: { personId: string }[]
  directors: { personId: string }[]
  productionCompanies: { companyId: string }[]
}

const uniqueIds = (entities: readonly { id: string }[]): string[] => [
  ...new Set(entities.map((entity) => entity.id)),
]

export class PrismaSeriesMapper {
  static toDomain(row: SeriesRow): Series {
    return Series.restore({
      id: row.id,
      title: new MovieTitle(row.title),
      overview: row.overview,
      firstAirDate: row.firstAirDate,
      lastAirDate: row.lastAirDate,
      // No trim despite `@db.Char(2)`: every value written is exactly two
      // chars, so blank padding never occurs and a short code means the row is
      // corrupt — better surfaced as InvalidLanguageCodeError than masked.
      originalLanguage: new LanguageCode(row.originalLanguage),
      posterPath: row.posterPath,
      backdropPath: row.backdropPath,
      genres: row.genres.map((join) => PrismaGenreMapper.toDomain(join.genre)),
      cast: row.cast.map((join) => PrismaPersonMapper.toDomain(join.person)),
      directors: row.directors.map((join) => PrismaPersonMapper.toDomain(join.person)),
      productionCompanies: row.productionCompanies.map((join) =>
        PrismaCompanyMapper.toDomain(join.company)
      ),
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
  static toPersistence(series: Series): SeriesPersistence {
    return {
      id: series.id,
      title: series.data.title.value,
      overview: series.data.overview,
      firstAirDate: series.data.firstAirDate,
      lastAirDate: series.data.lastAirDate,
      originalLanguage: series.data.originalLanguage.value,
      posterPath: series.data.posterPath,
      backdropPath: series.data.backdropPath,
      createdAt: series.data.createdAt,
      updatedAt: series.data.updatedAt,
    }
  }

  /**
   * Join-row payloads for the four relations, deduped by id: `setGenres` and
   * friends accept whatever the request supplied, and repeated ids would
   * violate the join tables' composite primary keys.
   */
  static toRelationWrites(series: Series): SeriesRelationWrites {
    return {
      genres: uniqueIds(series.data.genres).map((genreId) => ({ genreId })),
      cast: uniqueIds(series.data.cast).map((personId) => ({ personId })),
      directors: uniqueIds(series.data.directors).map((personId) => ({ personId })),
      productionCompanies: uniqueIds(series.data.productionCompanies).map((companyId) => ({
        companyId,
      })),
    }
  }
}
