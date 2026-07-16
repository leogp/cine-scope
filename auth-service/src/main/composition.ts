// http
import { AuthController } from '../infrastructure/http/controllers/authController'
// prisma
import { prisma } from '../infrastructure/prisma/client'
import { PrismaUserRepository } from '../infrastructure/prisma/user'
import { PrismaRoleRepository } from '../infrastructure/prisma/role'
import { PrismaRefreshTokenRepository } from '../infrastructure/prisma/refresh-token'
// use cases
import { LogoutUseCase } from '../application/use-cases/logout/logoutUseCase'
import { RefreshTokenUseCase } from '../application/use-cases/refresh-token/refreshTokenUseCase'
import { LoginUseCase } from '../application/use-cases/login/loginUseCase'
import { SignUpUseCase } from '../application/use-cases/signup/signUpUseCase'
// security
import { BcryptPasswordHasher } from '../infrastructure/security/bcryptPasswordHasher'
import { env } from '../config/env'
import { JwtRefreshTokenGenerator } from '../infrastructure/security/jwtRefreshTokenGenerator'
import { JwtAccessTokenGenerator } from '../infrastructure/security/jwtAccessTokenGenerator'

export function composeApp(): AuthController {
  const userRepository = new PrismaUserRepository(prisma)
  const roleRepository = new PrismaRoleRepository(prisma)
  const refreshTokenRepository = new PrismaRefreshTokenRepository(prisma)

  const bcryptPasswordHasher = new BcryptPasswordHasher()
  const accessTokenGenerator = new JwtAccessTokenGenerator(
    env.JWT_ACCESS_SECRET,
    env.JWT_ACCESS_EXPIRES_IN
  )
  const refreshTokenGenerator = new JwtRefreshTokenGenerator(
    env.JWT_REFRESH_SECRET,
    env.JWT_REFRESH_EXPIRES_IN
  )

  const signUpUseCase = new SignUpUseCase(userRepository, bcryptPasswordHasher, roleRepository)
  const loginUseCase = new LoginUseCase(
    userRepository,
    bcryptPasswordHasher,
    accessTokenGenerator,
    refreshTokenGenerator,
    refreshTokenRepository
  )
  const refreshTokenUseCase = new RefreshTokenUseCase(
    userRepository,
    refreshTokenRepository,
    accessTokenGenerator,
    refreshTokenGenerator
  )
  const logoutUseCase = new LogoutUseCase(refreshTokenRepository)

  return new AuthController(signUpUseCase, loginUseCase, refreshTokenUseCase, logoutUseCase)
}
