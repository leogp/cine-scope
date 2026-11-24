import { Series } from '../entities/series'

export interface SeriesRepository {
  findById(id: string): Promise<Series | null>

  // Neutral primitives on purpose: the domain port must not depend on the
  // application layer's pagination types. The use-case maps the window params
  // in and wraps the { items, total } window into a PaginatedResult out.
  findAll(params: { limit: number; offset: number }): Promise<{ items: Series[]; total: number }>

  save(series: Series): Promise<void>

  exists(id: string): Promise<boolean>

  delete(id: string): Promise<void>
}
