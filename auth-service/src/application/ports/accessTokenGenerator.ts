import { AccessTokenPayload } from './accessTokenPayload'

export interface AccessTokenGenerator {
  generate(payload: AccessTokenPayload): Promise<string>
}
