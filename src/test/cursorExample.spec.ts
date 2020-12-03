import { PoolClient, Pool } from 'pg'
import { runInPoolClient } from '../queries'
import { promisify } from 'util'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Cursor = require('pg-cursor')

// eslint-disable-next-line functional/immutable-data
Cursor.prototype.readAsync = promisify(Cursor.prototype.read)

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

const getCursor = (client: PoolClient, text: string) => {
  return client.query(new Cursor(text))
}

describe('db cursor', () => {
  afterAll(async () => {
    await pool.end()
  })

  it('returns all db rows using a cursor', async () => {
    await runInPoolClient(pool)(async (client) => {
      const cursor = getCursor(client, 'select * from person')
      const rows: [] = await cursor.readAsync(100)
      rows.map((row) => console.log(JSON.stringify(row)))
    })
  })
})
