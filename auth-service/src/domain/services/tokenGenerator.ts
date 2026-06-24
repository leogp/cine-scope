import { RefreshToken } from '../entities/refreshToken'
import { User } from '../entities/user'

export interface TokenGenerator {
  generateAccessToken(user: User): Promise<string>

  generateRefreshToken(user: User): Promise<RefreshToken>
}
