import { Request, Response } from 'express'

import { SignUpUseCase } from '../../../application/use-cases/signup/signUpUseCase'

export class AuthController {
  constructor(private readonly signUpUseCase: SignUpUseCase) {}

  // Arrow-fn property so `this` survives being passed as a route handler.
  // No try/catch: errors flow to the error middleware through asyncHandler.
  signUp = async (req: Request, res: Response): Promise<void> => {
    const { id } = await this.signUpUseCase.execute(req.body)
    res.status(201).json({ id })
  }
}
