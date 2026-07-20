import { ValueObject } from '@cinescope/shared/domain'
import { InvalidExternalResourceTypeError } from '../errors/invalidExternalResourceTypeError'

const EXTERNAL_RESOURCE_TYPES = ['movie', 'series', 'person', 'company'] as const

export type ExternalResourceTypeValue = (typeof EXTERNAL_RESOURCE_TYPES)[number]

function isExternalResourceTypeValue(value: string): value is ExternalResourceTypeValue {
  return (EXTERNAL_RESOURCE_TYPES as readonly string[]).includes(value)
}

export class ExternalResourceType extends ValueObject<ExternalResourceTypeValue> {
  constructor(value: string) {
    if (!isExternalResourceTypeValue(value)) {
      throw new InvalidExternalResourceTypeError()
    }

    super(value)
  }
}
