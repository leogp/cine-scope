import { DomainError } from '@cinescope/shared/domain'

interface Finder<E> {
  findById(id: string): Promise<E | null>
}

/**
 * Resolves a list of ids into their entities via the given finder, throwing
 * `onMissing()` for the first id that has no match. Used to turn the relation
 * id-arrays on create/update requests into the entities the aggregate
 * expects. Resolution runs in parallel; a single miss rejects the whole batch.
 */
export async function resolveByIds<E>(
  ids: string[],
  finder: Finder<E>,
  onMissing: () => DomainError
): Promise<E[]> {
  return Promise.all(
    ids.map(async (id) => {
      const entity = await finder.findById(id)

      if (!entity) {
        throw onMissing()
      }

      return entity
    })
  )
}
