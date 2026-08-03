import { Request, Response } from 'express'

import { CreateCompanyUseCase } from '@catalog/application/use-cases/company/create/createCompanyUseCase'
import { GetCompanyUseCase } from '@catalog/application/use-cases/company/get/getCompanyUseCase'

export class CompanyController {
  constructor(
    private readonly createCompanyUseCase: CreateCompanyUseCase,
    private readonly getCompanyUseCase: GetCompanyUseCase
  ) {}

  // Arrow-fn property so `this` survives being passed as a route handler.
  // No try/catch: errors flow to the error middleware through asyncHandler.
  create = async (req: Request, res: Response): Promise<void> => {
    const { id } = await this.createCompanyUseCase.execute(req.body)
    res.status(201).json({ id })
  }

  get = async (req: Request, res: Response): Promise<void> => {
    const company = await this.getCompanyUseCase.execute({ id: req.params.id })
    res.status(200).json(company)
  }
}
