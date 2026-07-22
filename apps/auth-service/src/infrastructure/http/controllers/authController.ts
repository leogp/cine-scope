import { Request, Response } from 'express'

import { SignUpUseCase } from '../../../application/use-cases/signup/signUpUseCase'
import { LoginUseCase } from '../../../application/use-cases/login/loginUseCase'
import { RefreshTokenUseCase } from '../../../application/use-cases/refresh-token/refreshTokenUseCase'
import { LogoutUseCase } from '../../../application/use-cases/logout/logoutUseCase'

export class AuthController {
  constructor(
    private readonly signUpUseCase: SignUpUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly logoutUseCase: LogoutUseCase
  ) {}

  // Arrow-fn property so `this` survives being passed as a route handler.
  // No try/catch: errors flow to the error middleware through asyncHandler.
  signUp = async (req: Request, res: Response): Promise<void> => {
    const { id } = await this.signUpUseCase.execute(req.body)
    res.status(201).json({ id })
  }

  login = async (req: Request, res: Response): Promise<void> => {
    const { accessToken, refreshToken } = await this.loginUseCase.execute(req.body)
    res.status(200).json({ accessToken, refreshToken })
  }

  refresh = async (req: Request, res: Response): Promise<void> => {
    const { accessToken, refreshToken } = await this.refreshTokenUseCase.execute(req.body)
    res.status(200).json({ accessToken, refreshToken })
  }

  logout = async (req: Request, res: Response): Promise<void> => {
    await this.logoutUseCase.execute(req.body)
    res.status(204).send()
  }
}
