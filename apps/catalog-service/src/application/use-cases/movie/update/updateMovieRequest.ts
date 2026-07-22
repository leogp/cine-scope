import { CreateMovieRequest } from '../create/createMovieRequest'

// Full-replace (PUT) semantics: the update carries the complete movie state,
// same fields as create plus the target id.
export type UpdateMovieRequest = CreateMovieRequest & {
  id: string
}
