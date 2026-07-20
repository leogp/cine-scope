import { ValueObject } from '@cinescope/shared/domain'
import { InvalidExternalProviderError } from '../errors/invalidExternalProviderError'

const EXTERNAL_PROVIDERS = ['tmdb', 'imdb', 'wikidata'] as const

export type ExternalProviderValue = (typeof EXTERNAL_PROVIDERS)[number]

function isExternalProviderValue(value: string): value is ExternalProviderValue {
  return (EXTERNAL_PROVIDERS as readonly string[]).includes(value)
}

export class ExternalProvider extends ValueObject<ExternalProviderValue> {
  constructor(value: string) {
    if (!isExternalProviderValue(value)) {
      throw new InvalidExternalProviderError()
    }

    super(value)
  }
}
