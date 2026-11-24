import { Request, Response } from 'express'

import { CreateSeriesUseCase } from '@catalog/application/use-cases/series/create/createSeriesUseCase'
import { GetSeriesUseCase } from '@catalog/application/use-cases/series/get/getSeriesUseCase'
import { ListSeriesRequest } from '@catalog/application/use-cases/series/list/listSeriesRequest'
import { ListSeriesUseCase } from '@catalog/application/use-cases/series/list/listSeriesUseCase'

export class SeriesController {
  constructor(
    private readonly createSeriesUseCase: CreateSeriesUseCase,
    private readonly getSeriesUseCase: GetSeriesUseCase,
    private readonly listSeriesUseCase: ListSeriesUseCase
  ) {}

  // Arrow-fn property so `this` survives being passed as a route handler.
  // No try/catch: errors flow to the error middleware through asyncHandler.
  create = async (req: Request, res: Response): Promise<void> => {
    const { id } = await this.createSeriesUseCase.execute(req.body)
    res.status(201).json({ id })
  }

  get = async (req: Request, res: Response): Promise<void> => {
    const series = await this.getSeriesUseCase.execute({ id: req.params.id })
    res.status(200).json(series)
  }

  list = async (req: Request, res: Response): Promise<void> => {
    const result = await this.listSeriesUseCase.execute(req.query as ListSeriesRequest)
    res.status(200).json(result)
  }
}
