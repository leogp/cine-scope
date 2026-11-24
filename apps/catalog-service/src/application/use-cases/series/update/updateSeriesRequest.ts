import { CreateSeriesRequest } from '../create/createSeriesRequest'

// Full-replace (PUT) semantics: the update carries the complete series state,
// same fields as create plus the target id.
export type UpdateSeriesRequest = CreateSeriesRequest & {
  id: string
}
