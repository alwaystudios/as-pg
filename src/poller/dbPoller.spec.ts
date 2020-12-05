import { waitUntil } from '@alwaystudios/as-utils'
import { testPgClient, testPgPool, testRunInTransaction } from '../test/pgFactories'
import { dbPollerFactory } from './dbPoller'
import * as pollerQueries from './pollerQueries'
import * as transactions from '../transaction'

const runInTransaction = jest.spyOn(transactions, 'runInTransaction')
const getPollerRecords = jest.spyOn(pollerQueries, 'getPollerRecords')
const processPollerRecords = jest.spyOn(pollerQueries, 'processPollerRecords')

type TestRecord = {
  id: number
  processed: boolean
}

const testRecord = (id: number) => ({
  id,
  processed: false,
})

const testRecords = (size: number) => [...Array(size)].map((_, i) => testRecord(i))

describe('db poller', () => {
  // eslint-disable-next-line functional/no-let
  let intervalId: NodeJS.Timeout | null

  beforeEach(jest.clearAllMocks)

  afterEach(() => {
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
  })

  it('processess records', async () => {
    const records = testRecords(3)
    const recordIds = records.map(({ id }) => id)
    const client = testPgClient()
    runInTransaction.mockImplementation(() => testRunInTransaction(client))
    const onReceiveData = jest.fn()
    getPollerRecords.mockResolvedValue(records)
    processPollerRecords.mockResolvedValue()

    const pool = testPgPool()

    const poller = dbPollerFactory<TestRecord>({
      pool,
      tableName: 'test',
      interval: 600,
      batchSize: 10,
      onReceiveData,
    })
    intervalId = poller.schedulePoller()

    await waitUntil(() => {
      expect(processPollerRecords).toHaveBeenCalledWith(client, 'test', recordIds, false)
      expect(onReceiveData).toHaveBeenCalledWith(records)
    })
  })

  it('continues to process on error', async () => {
    const records = testRecords(3)
    const recordIds = records.map(({ id }) => id)
    const client = testPgClient()
    runInTransaction.mockImplementation(() => testRunInTransaction(client))
    const onReceiveData = jest.fn()
    const error = new Error('boom')
    getPollerRecords.mockRejectedValueOnce(error).mockResolvedValue(records)
    processPollerRecords.mockResolvedValue()

    const pool = testPgPool()

    const poller = dbPollerFactory<TestRecord>({
      pool,
      tableName: 'test',
      interval: 600,
      batchSize: 10,
      onReceiveData,
    })
    intervalId = poller.schedulePoller()

    await waitUntil(() => {
      expect(processPollerRecords).toHaveBeenCalledWith(client, 'test', recordIds, false)
      expect(onReceiveData).toHaveBeenCalledWith(records)
    })
  })
})
