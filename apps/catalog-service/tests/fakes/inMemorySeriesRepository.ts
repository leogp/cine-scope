import { Series } from '@catalog/domain/entities/series'
import { SeriesRepository } from '@catalog/domain/repositories/seriesRepository'

export class InMemorySeriesRepository implements SeriesRepository {
  private readonly series = new Map<string, Series>()

  get size(): number {
    return this.series.size
  }

  async findById(id: string): Promise<Series | null> {
    return this.series.get(id) ?? null
  }

  async findAll(params: { limit: number; offset: number }): Promise<{
    items: Series[]
    total: number
  }> {
    const sorted = [...this.series.values()].sort(
      (a, b) => a.data.createdAt.getTime() - b.data.createdAt.getTime()
    )

    return {
      items: sorted.slice(params.offset, params.offset + params.limit),
      total: this.series.size,
    }
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
