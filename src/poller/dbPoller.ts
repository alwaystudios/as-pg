import { Pool } from 'pg'
import { runInTransaction } from '..'
import { getPollerRecords, processPollerRecords } from './pollerQueries'
import { withRunningState } from './runningState'

export type PollerRecordType = {
  id: number
  processed: boolean
}

type FactoryProps = {
  pool: Pool
  tableName: string
  interval: number
  batchSize: number
  onReceiveData: <T>(records: T[]) => Promise<void>
  deleteRecords?: boolean
}

export const dbPollerFactory = <T extends PollerRecordType>(props: FactoryProps) => {
  const { pool, tableName, interval, batchSize, onReceiveData, deleteRecords = false } = props
  const [isRunning, setRunning] = withRunningState()

  const schedulePoller = () => {
    return setInterval(async () => {
      if (isRunning()) {
        return
      }

      setRunning(true)

      await runInTransaction(pool)((client) =>
        getPollerRecords<T>(client, tableName, batchSize).then(async (records) => {
          await onReceiveData(records)

          await processPollerRecords(
            client,
            tableName,
            records.map(({ id }) => id),
            deleteRecords,
          )
        }),
      ).catch((error) => console.error('Poller process terminated with error:', error))

      setRunning(false)
    }, interval)
  }
  return { schedulePoller }
}

export type DbPollerFactoryType = ReturnType<typeof dbPollerFactory>
