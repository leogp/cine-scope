export interface ExternalReferenceProps {
  id: string
  provider: ExternalProvider
  resourceType: ExternalResourceType
  externalId: string
  createdAt: Date
}

export class ExternalReference {
  constructor(private props: ExternalReferenceProps) {}

  get id() {
    return this.props.id
  }

  get provider() {
    return this.props.provider
  }

  get resourceType() {
    return this.props.resourceType
  }

  get externalId() {
    return this.props.externalId
  }
}
