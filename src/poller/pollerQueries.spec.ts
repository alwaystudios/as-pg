import { testPgClient } from '../test/pgFactories'
import { getPollerRecords, processPollerRecords } from './pollerQueries'

describe('poller queries', () => {
  beforeEach(jest.resetAllMocks)

  describe('getPollerRecords', () => {
    it('returns records that have not yet been processed', async () => {
      const count = 1
      const record = {
        id: 1,
        processed: false,
      }

      const query = jest.fn().mockResolvedValueOnce({
        rows: [record],
      })

      const client = testPgClient({ query })
      const table = 'poller_table'

      await getPollerRecords(client, table, count)

      expect(query).toBeCalledTimes(1)
      expect(
        query,
      ).toHaveBeenCalledWith(
        `select * from ${table} where coalesce(processed,false)=false order by id asc limit $1 for update`,
        [count],
      )
    })

    it('throws on error', async () => {
      const count = 1
      const error = new Error('boom')
      const query = jest.fn().mockRejectedValueOnce(error)

      const client = testPgClient({ query })
      const table = 'poller_table'

      const expectedError = new Error(`Failed to get poller messages: ${error.message}`)
      await expect(getPollerRecords(client, table, count)).rejects.toEqual(expectedError)
    })
  })

  describe('processPollerRecords', () => {
    it('processes records with delete', async () => {
      const query = jest.fn().mockResolvedValueOnce({
        rowCount: 3,
      })

      const client = testPgClient({ query })
      const table = 'poller_table'

      await processPollerRecords(client, table, [1, 2, 3], true)

      expect(query).toBeCalledTimes(1)
      expect(query).toHaveBeenCalledWith(`delete from ${table} where id in ( 1, 2, 3 )`)
    })

    it('processes records with update processed column', async () => {
      const query = jest.fn().mockResolvedValueOnce({
        rowCount: 3,
      })

      const client = testPgClient({ query })
      const table = 'poller_table'

      await processPollerRecords(client, table, [1, 2, 3], false)

      expect(query).toBeCalledTimes(1)
      expect(query).toHaveBeenCalledWith(
        `update ${table} set processed = true where id in ( 1, 2, 3 )`,
      )
    })

    it('does not attempt to process an empty list', async () => {
      const query = jest.fn().mockResolvedValueOnce({
        rowCount: 3,
      })

      const client = testPgClient({ query })
      const table = 'poller_table'

      await processPollerRecords(client, table, [], false)

      expect(query).not.toHaveBeenCalled()
    })

    it('throws on error', async () => {
      const error = new Error('boom')
      const query = jest.fn().mockRejectedValueOnce(error)

      const client = testPgClient({ query })
      const table = 'poller_table'

      const expectedError = new Error(`Failed to process poller messages: ${error.message}`)
      await expect(processPollerRecords(client, table, [1, 2, 3], false)).rejects.toEqual(
        expectedError,
      )
    })
  })
})
