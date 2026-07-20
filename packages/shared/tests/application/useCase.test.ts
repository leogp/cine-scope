import { ApplicationError } from '../../src/application/applicationError'
import { Command, CommandHandler } from '../../src/application/command'
import { Query, QueryHandler } from '../../src/application/query'

interface GreetCommand extends Command {
  name: string
}

class GreetUseCase implements CommandHandler<GreetCommand, string> {
  async execute(input: GreetCommand): Promise<string> {
    return `hello ${input.name}`
  }
}

interface CountQuery extends Query {
  from: number
}

class CountUseCase implements QueryHandler<CountQuery, number> {
  async execute(input: CountQuery): Promise<number> {
    return input.from + 1
  }
}

class StubFailedError extends ApplicationError {
  constructor() {
    super('stub failed')
  }
}

describe('UseCase / Command / Query', () => {
  it('a command handler executes against its input DTO', async () => {
    await expect(new GreetUseCase().execute({ name: 'leo' })).resolves.toBe('hello leo')
  })

  it('a query handler executes against its input DTO', async () => {
    await expect(new CountUseCase().execute({ from: 1 })).resolves.toBe(2)
  })

  it('ApplicationError sets name to the concrete class name', () => {
    const error = new StubFailedError()

    expect(error.name).toBe('StubFailedError')
    expect(error).toBeInstanceOf(ApplicationError)
  })
})
