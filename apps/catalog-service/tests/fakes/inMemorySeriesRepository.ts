import { Series } from '../../src/domain/entities/series'
import { SeriesRepository } from '../../src/domain/repositories/seriesRepository'

export class InMemorySeriesRepository implements SeriesRepository {
  private readonly series = new Map<string, Series>()

  get size(): number {
    return this.series.size
  }

  async findById(id: string): Promise<Series | null> {
    return this.series.get(id) ?? null
  }

  async save(series: Series): Promise<void> {
    this.series.set(series.id, series)
  }

  async exists(id: string): Promise<boolean> {
    return this.series.has(id)
  }

  async delete(id: string): Promise<void> {
    this.series.delete(id)
  }
}
