import { UseCase } from './useCase'

/**
 * Marker for input DTOs that read system state without mutating it.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface Query {}

/** A use case that processes a Query. */
export type QueryHandler<Q extends Query, Output> = UseCase<Q, Output>
