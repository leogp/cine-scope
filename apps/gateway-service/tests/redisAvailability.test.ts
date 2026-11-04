import { ErrorReply } from 'redis'

import { RedisAvailability } from '@gateway/infrastructure/redis/redisAvailability'

describe('Redis availability logging', () => {
  let warn: jest.SpyInstance
  let info: jest.SpyInstance
  let availability: RedisAvailability

  beforeEach(() => {
    warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined)
    info = jest.spyOn(console, 'info').mockImplementation(() => undefined)
    availability = new RedisAvailability()
  })

  afterEach(() => jest.restoreAllMocks())

  it('warns once when Redis starts failing, however many failures follow', () => {
    for (let i = 0; i < 5; i++) availability.markUnavailable(new Error('connect ECONNREFUSED'))

    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('ECONNREFUSED'))
  })

  it('logs one line when it recovers, however many successes follow', () => {
    availability.markUnavailable(new Error('connect ECONNREFUSED'))
    for (let i = 0; i < 5; i++) availability.markAvailable()

    expect(info).toHaveBeenCalledTimes(1)
  })

  it('logs every transition of a flapping Redis, and nothing in between', () => {
    availability.markAvailable()
    availability.markUnavailable(new Error('a'))
    availability.markUnavailable(new Error('b'))
    availability.markAvailable()
    availability.markUnavailable(new Error('c'))

    expect(info).toHaveBeenCalledTimes(2)
    expect(warn).toHaveBeenCalledTimes(2)
  })

  describe('track', () => {
    it('passes a reply through and records Redis as available', async () => {
      availability.markUnavailable(new Error('down'))

      await expect(availability.track(() => Promise.resolve('OK'))).resolves.toBe('OK')
      expect(info).toHaveBeenCalledTimes(1)
    })

    it('rethrows a failed command and records Redis as unavailable', async () => {
      await expect(
        availability.track(() => Promise.reject(new Error('The client is offline')))
      ).rejects.toThrow('The client is offline')
      expect(warn).toHaveBeenCalledTimes(1)
    })

    it('treats an error reply as Redis answering', async () => {
      availability.markAvailable()

      await expect(
        availability.track(() => Promise.reject(new ErrorReply('NOSCRIPT No matching script')))
      ).rejects.toThrow('NOSCRIPT')
      expect(warn).not.toHaveBeenCalled()
    })
  })
})
