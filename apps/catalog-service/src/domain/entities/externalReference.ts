import { Entity, EntityProps } from '@cinescope/shared/domain'
import { ExternalProvider } from '../value-objects/externalProvider'
import { ExternalResourceType } from '../value-objects/externalResourceType'
import { ExternalId } from '../value-objects/externalId'

export interface ExternalReferenceProps extends EntityProps {
  provider: ExternalProvider
  resourceType: ExternalResourceType
  externalId: ExternalId
  createdAt: Date
}

export class ExternalReference extends Entity<ExternalReferenceProps> {
  constructor(props: ExternalReferenceProps) {
    super(props)
  }
}
