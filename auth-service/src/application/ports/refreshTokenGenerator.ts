import { GeneratedRefreshToken } from './generatedRefreshToken'

export interface RefreshTokenGenerator {
  generate(subject: string): Promise<GeneratedRefreshToken>
}
