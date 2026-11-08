import express, { type Application, type Response } from 'express'
import type { ServerResponse } from 'http'
import request from 'supertest'

import { teeResponse, type TeeOptions } from '@gateway/infrastructure/http/cache/teeResponse'

/** Serves GET / by teeing the response, then letting `produce` write it. */
const serve = (
  options: (res: Response) => TeeOptions,
  produce: (res: Response) => void
): Application => {
  const app = express()
  app.get('/', (_req, res) => {
    teeResponse(res, options(res))
    produce(res)
  })
  return app
}

describe('teeResponse', () => {
  let completed: Buffer[]
  const collectInto = (maxBytes: number) => (): TeeOptions => ({
    maxBytes,
    accept: () => true,
    onComplete: (body) => completed.push(body),
  })

  beforeEach(() => {
    completed = []
  })

  it('captures the bytes the client receives, whatever the chunk type and encoding', async () => {
    const app = serve(collectInto(1_024), (res) => {
      res.status(200).type('text/plain')
      res.write('caf')
      res.write('w6k=', 'base64') // é
      res.write(Buffer.from(' au'))
      res.write(new Uint8Array([0x20]))
      res.end('6c616974', 'hex') // lait
    })

    const response = await request(app).get('/').expect(200)

    expect(response.text).toBe('café au lait')
    expect(completed.map((body) => body.toString('utf8'))).toEqual(['café au lait'])
  })

  it('drops the capture past maxBytes and still delivers the whole body', async () => {
    const app = serve(collectInto(4), (res) => {
      res.status(200).type('text/plain')
      res.write('café')
      res.end(' au lait')
    })

    const response = await request(app).get('/').expect(200)

    expect(response.text).toBe('café au lait')
    expect(completed).toEqual([])
  })

  it('asks accept once the status and headers are final, and captures nothing on a no', async () => {
    let seen: unknown
    const app = serve(
      (res) => ({
        maxBytes: 1_024,
        accept: () => {
          seen = { status: res.statusCode, late: res.getHeader('X-Late') }
          return false
        },
        onComplete: (body) => completed.push(body),
      }),
      (res) => {
        res.status(201)
        res.setHeader('X-Late', 'yes')
        res.end('created')
      }
    )

    await request(app).get('/').expect(201)

    expect(seen).toEqual({ status: 201, late: 'yes' })
    expect(completed).toEqual([])
  })

  it('passes every call through unchanged and returns what the original returned', () => {
    const fake = { writeHead: jest.fn(), write: jest.fn().mockReturnValue(false), end: jest.fn() }
    fake.writeHead.mockReturnValue(fake)
    fake.end.mockReturnValue(fake)
    const { writeHead, write, end } = fake
    const res = fake as unknown as ServerResponse
    teeResponse(res, collectInto(1_024)())
    const callback = jest.fn()

    expect(res.writeHead(200, { 'Content-Type': 'text/plain' })).toBe(fake)
    expect(res.write('café', 'latin1', callback)).toBe(false)
    expect(res.end(callback)).toBe(fake)
    expect(res.end()).toBe(fake)

    expect(writeHead).toHaveBeenCalledWith(200, { 'Content-Type': 'text/plain' })
    expect(write).toHaveBeenCalledWith('café', 'latin1', callback)
    expect(write.mock.contexts[0]).toBe(fake)
    expect(end).toHaveBeenNthCalledWith(1, callback)
    // The second end captured nothing more.
    expect(completed).toEqual([Buffer.from('café', 'latin1')])
  })
})
