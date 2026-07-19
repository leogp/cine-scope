import { UseCase } from './useCase'

/**
 * Marker for input DTOs that mutate system state (e.g. CreateMovieCommand).
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface Command {}

/** A use case that processes a Command. Mutations usually return little or nothing. */
export type CommandHandler<C extends Command, Output = void> = UseCase<C, Output>
