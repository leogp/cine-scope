import { Application } from 'express'

import { LoginUseCase } from '../../src/application/use-cases/login/loginUseCase'
import { LogoutUseCase } from '../../src/application/use-cases/logout/logoutUseCase'
import { RefreshTokenUseCase } from '../../src/application/use-cases/refresh-token/refreshTokenUseCase'
import { SignUpUseCase } from '../../src/application/use-cases/signup/signUpUseCase'
import { buildApp } from '../../src/infrastructure/http/app'
import { AuthController } from '../../src/infrastructure/http/controllers/authController'
import { FakePasswordHasher } from '../fakes/fakePasswordHasher'
import { FakeAccessTokenGenerator, FakeRefreshTokenGenerator } from '../fakes/fakeTokenGenerators'
import { InMemoryRefreshTokenRepository } from '../fakes/inMemoryRefreshTokenRepository'
import { InMemoryRoleRepository } from '../fakes/inMemoryRoleRepository'
import { InMemoryUserRepository } from '../fakes/inMemoryUserRepository'
import { buildRole } from './builders'

interface TestApp {
  app: Application
  userRepository: InMemoryUserRepository
  refreshTokenRepository: InMemoryRefreshTokenRepository
}

/**
 * Real use cases, controller and Express app wired against in-memory fakes:
 * the whole HTTP layer under test without a database.
 */
export const buildTestApp = (): TestApp => {
  const userRepository = new InMemoryUserRepository()
  const roleRepository = new InMemoryRoleRepository(buildRole())
  const refreshTokenRepository = new InMemoryRefreshTokenRepository()
  const passwordHasher = new FakePasswordHasher()
  const accessTokenGenerator = new FakeAccessTokenGenerator()
  const refreshTokenGenerator = new FakeRefreshTokenGenerator()

  const controller = new AuthController(
    new SignUpUseCase(userRepository, passwordHasher, roleRepository),
    new LoginUseCase(
      userRepository,
      passwordHasher,
      accessTokenGenerator,
      refreshTokenGenerator,
      refreshTokenRepository
    ),
    new RefreshTokenUseCase(
      userRepository,
      refreshTokenRepository,
      accessTokenGenerator,
      refreshTokenGenerator
    ),
    new LogoutUseCase(refreshTokenRepository)
  )

  return { app: buildApp(controller), userRepository, refreshTokenRepository }
}

export const validSignUpBody = {
  username: 'leo_dev',
  email: 'leo@example.com',
  password: 'Str0ng!Pass',
  name: 'Leo',
}
