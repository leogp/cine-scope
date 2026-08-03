import { Request, Response } from 'express'

import { CreatePersonUseCase } from '../../../application/use-cases/person/create/createPersonUseCase'
import { GetPersonUseCase } from '../../../application/use-cases/person/get/getPersonUseCase'

export class PersonController {
  constructor(
    private readonly createPersonUseCase: CreatePersonUseCase,
    private readonly getPersonUseCase: GetPersonUseCase
  ) {}

  // Arrow-fn property so `this` survives being passed as a route handler.
  // No try/catch: errors flow to the error middleware through asyncHandler.
  create = async (req: Request, res: Response): Promise<void> => {
    const { id } = await this.createPersonUseCase.execute(req.body)
    res.status(201).json({ id })
  }

  get = async (req: Request, res: Response): Promise<void> => {
    const person = await this.getPersonUseCase.execute({ id: req.params.id })
    res.status(200).json(person)
  }
}
