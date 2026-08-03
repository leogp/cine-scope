import { Request, Response } from 'express'

import { CreateMovieUseCase } from '../../../application/use-cases/movie/create/createMovieUseCase'
import { DeleteMovieUseCase } from '../../../application/use-cases/movie/delete/deleteMovieUseCase'
import { GetMovieUseCase } from '../../../application/use-cases/movie/get/getMovieUseCase'
import { ListMoviesRequest } from '../../../application/use-cases/movie/list/listMoviesRequest'
import { ListMoviesUseCase } from '../../../application/use-cases/movie/list/listMoviesUseCase'
import { UpdateMovieUseCase } from '../../../application/use-cases/movie/update/updateMovieUseCase'

export class MovieController {
  constructor(
    private readonly createMovieUseCase: CreateMovieUseCase,
    private readonly getMovieUseCase: GetMovieUseCase,
    private readonly listMoviesUseCase: ListMoviesUseCase,
    private readonly updateMovieUseCase: UpdateMovieUseCase,
    private readonly deleteMovieUseCase: DeleteMovieUseCase
  ) {}

  // Arrow-fn property so `this` survives being passed as a route handler.
  // No try/catch: errors flow to the error middleware through asyncHandler.
  create = async (req: Request, res: Response): Promise<void> => {
    const { id } = await this.createMovieUseCase.execute(req.body)
    res.status(201).json({ id })
  }

  get = async (req: Request, res: Response): Promise<void> => {
    const movie = await this.getMovieUseCase.execute({ id: req.params.id })
    res.status(200).json(movie)
  }

  list = async (req: Request, res: Response): Promise<void> => {
    const result = await this.listMoviesUseCase.execute(req.query as ListMoviesRequest)
    res.status(200).json(result)
  }

  update = async (req: Request, res: Response): Promise<void> => {
    const { id } = await this.updateMovieUseCase.execute({ ...req.body, id: req.params.id })
    res.status(200).json({ id })
  }

  delete = async (req: Request, res: Response): Promise<void> => {
    await this.deleteMovieUseCase.execute({ id: req.params.id })
    res.status(204).send()
  }
}
