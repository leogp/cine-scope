import { Series } from '../entities/serie'

export interface SeriesRepository {
  findById(id: string): Promise<Series | null>

  save(series: Series): Promise<void>

  exists(id: string): Promise<boolean>

  delete(id: string): Promise<void>
}
