import { promiseRetry } from '@alwaystudios/as-utils'
import { Pool } from 'pg'
import { dbPollerFactory } from '../poller/dbPoller'
import { runInPoolClient } from '../queries'

const pool = new Pool({
  min: 10,
  max: 20,
  host: 'localhost',
  port: 5432,
  database: 'demo',
  user: 'postgres',
  password: 'test123',
  idleTimeoutMillis: 60000,
  connectionTimeoutMillis: 60000,
})
pool.on('error', (error: Error) => {
  console.error('An idle PG client has experienced an error. ', error)
})

type PersonRecord = {
  id: number
  processed: boolean
  details: Record<string, unknown>
}

const getRecordCount = (): Promise<number> =>
  runInPoolClient(pool)((client) =>
    client
      .query('select count(id) as count from person where processed = false')
      .then(({ rows }) => rows[0].count),
  ).then((count) => Number(count))

const onReceiveData = async <PersonRecord>(records: PersonRecord[]) => {
  if (!records.length) {
    console.warn('no more data')
  }
}

const poller = dbPollerFactory<PersonRecord>({
  pool,
  tableName: 'person',
  interval: 10,
  batchSize: 1000,
  onReceiveData,
})

Promise.resolve()
  .then(async () => {
    const startCount = await getRecordCount()
    console.log(startCount)

    const processId = poller.schedulePoller()

    await promiseRetry({ attempts: 1000000, timeout: 2000 })(async () => {
      const count = await getRecordCount()
      if (count) {
        throw Error('still processing records')
      }
      clearInterval(processId)
    })
  })
  .catch(async (error) => {
    console.error(error)
  })
  .then(() => {
    console.log('poller test complete')
    process.exit(0)
  })
  .finally(async () => {
    await pool.end()
  })
