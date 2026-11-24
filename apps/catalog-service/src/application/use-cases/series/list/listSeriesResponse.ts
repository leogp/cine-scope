import { PaginatedResult } from '@cinescope/shared/application'
import { SeriesSummaryDTO } from '../shared/seriesMappers'

export type ListSeriesResponse = PaginatedResult<SeriesSummaryDTO>
