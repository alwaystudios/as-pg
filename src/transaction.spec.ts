import { testPgClient, testPgPool } from './test/pgFactories'
import { runInTransaction } from './transaction'

describe('transaction', () => {
  beforeEach(jest.resetAllMocks)

  afterEach(jest.clearAllMocks)

  it('transaction succeeds', async () => {
    const query = jest.fn().mockResolvedValue(undefined)
    const release = jest.fn().mockResolvedValue(undefined)
    const connect = jest.fn().mockResolvedValue(testPgClient({ query, release }))
    const pool = testPgPool({ connect })

    const expected = 'func result'
    const func = jest.fn().mockResolvedValueOnce(expected)

    const result = await runInTransaction(pool)(func)

    expect(connect).toBeCalledTimes(1)
    expect(func).toBeCalledTimes(1)
    expect(release).toBeCalledTimes(1)
    expect(result).toEqual(expected)
    expect(query).toBeCalledTimes(2)
    expect(query).toHaveBeenNthCalledWith(1, 'BEGIN')
    expect(query).toHaveBeenNthCalledWith(2, 'COMMIT')
  })

  it('transaction fails', async () => {
    const query = jest.fn().mockResolvedValue(undefined)
    const release = jest.fn().mockResolvedValue(undefined)
    const connect = jest.fn().mockResolvedValue(testPgClient({ query, release }))
    const pool = testPgPool({ connect })

    const func = jest.fn().mockRejectedValueOnce(new Error('some error'))

    await expect(runInTransaction(pool)(func)).rejects.toEqual(new Error('some error'))

    expect(connect).toBeCalledTimes(1)
    expect(func).toBeCalledTimes(1)
    expect(release).toBeCalledTimes(1)
    expect(query).toBeCalledTimes(2)
    expect(query).toHaveBeenNthCalledWith(1, 'BEGIN')
    expect(query).toHaveBeenNthCalledWith(2, 'ROLLBACK')
  })

  it('transaction connect fails', async () => {
    const query = jest.fn().mockResolvedValue(undefined)
    const release = jest.fn().mockResolvedValue(undefined)
    const connect = jest.fn().mockRejectedValueOnce(new Error('some error'))
    const pool = testPgPool({ connect })

    const func = jest.fn()

    await expect(runInTransaction(pool)(func)).rejects.toEqual(new Error('some error'))

    expect(connect).toBeCalledTimes(1)
    expect(func).not.toHaveBeenCalled()
    expect(release).not.toHaveBeenCalled()
    expect(query).not.toHaveBeenCalled()
  })
})
