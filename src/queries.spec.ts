import { runInPoolClient, verifyAtLeastOneRow } from './queries'
import { testConnectionPool, testPgClient, testQueryResults } from './test/pgFactories'

describe('queries', () => {
  describe('verifyAtLeastOneRow', () => {
    it('does not throw an error when on row count is not zero', () => {
      expect(() => verifyAtLeastOneRow('test')(testQueryResults({ rowCount: 1 }))).not.toThrow()
    })

    it('throws an error when no row count is zero', () => {
      expect(() => verifyAtLeastOneRow('test')(testQueryResults({ rowCount: 0 }))).toThrowError(
        new Error('Expected test to have row count of at least one'),
      )
    })
  })

  describe('runInPoolClient', () => {
    it('runInPoolClient succeeds', async () => {
      const release = jest.fn().mockResolvedValue(undefined)
      const connect = jest.fn().mockResolvedValue(testPgClient({ release }))
      const pool = testConnectionPool({ connect })
      const expected = 'function result'
      const func = jest.fn().mockResolvedValueOnce(expected)

      const result = await runInPoolClient(pool)(func)

      expect(connect).toBeCalledTimes(1)
      expect(func).toBeCalledTimes(1)
      expect(release).toBeCalledTimes(1)
      expect(result).toEqual(expected)
    })

    it('runInPoolClient fails', async () => {
      const release = jest.fn().mockResolvedValue(undefined)
      const connect = jest.fn().mockResolvedValue(testPgClient({ release }))
      const pool = testConnectionPool({ connect })
      const error = new Error('boom')
      const func = jest.fn().mockRejectedValueOnce(error)

      await expect(runInPoolClient(pool)(func)).rejects.toEqual(error)

      expect(connect).toBeCalledTimes(1)
      expect(func).toBeCalledTimes(1)
      expect(release).toBeCalledTimes(1)
    })

    it('runInPoolClient connection fails', async () => {
      const release = jest.fn().mockResolvedValue(undefined)
      const error = new Error('boom')
      const connect = jest.fn().mockRejectedValueOnce(error)
      const pool = testConnectionPool({ connect })
      const func = jest.fn()

      await expect(runInPoolClient(pool)(func)).rejects.toEqual(error)

      expect(connect).toBeCalledTimes(1)
      expect(func).not.toHaveBeenCalled()
      expect(release).not.toHaveBeenCalled()
    })
  })
})
