import { Request, Response } from 'express'

import { CreateGenreUseCase } from '@catalog/application/use-cases/genre/create/createGenreUseCase'
import { GetGenreUseCase } from '@catalog/application/use-cases/genre/get/getGenreUseCase'

export class GenreController {
  constructor(
    private readonly createGenreUseCase: CreateGenreUseCase,
    private readonly getGenreUseCase: GetGenreUseCase
  ) {}

  // Arrow-fn property so `this` survives being passed as a route handler.
  // No try/catch: errors flow to the error middleware through asyncHandler.
  create = async (req: Request, res: Response): Promise<void> => {
    const { id } = await this.createGenreUseCase.execute(req.body)
    res.status(201).json({ id })
  }

  get = async (req: Request, res: Response): Promise<void> => {
    const genre = await this.getGenreUseCase.execute({ id: req.params.id })
    res.status(200).json(genre)
  }
}
