import { promiseRetry, promiseTimeout } from '@alwaystudios/as-utils'
import { Pool } from 'pg'
import { runInPoolClient } from '../queries'
import { runInTransaction } from '../transaction'

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

type ProcessResponse = {
  name: string
  details: any
}

const id = 1
const details = {
  firstName: 'test-name',
  lastName: 'test-surname',
}

const processor = (name: string, query: string) => (): Promise<ProcessResponse> => {
  return promiseRetry()(async () => {
    return runInTransaction(pool)(async (client) => {
      const details = await client.query(query, [id]).then(({ rows }) => rows[0].details)

      await promiseTimeout(500)

      const newDetails = { ...details, [name]: true }
      await client.query(`update person set details = $1 where id = $2`, [newDetails, id])
      return details
    })
  }).then((details) => ({ name, details }))
}

describe('row locking', () => {
  afterAll(async () => {
    await pool.end()
  })

  beforeEach(async () => {
    await runInPoolClient(pool)((client) =>
      client.query('update person set details = $1 where id = $2', [details, id]),
    )
  })

  it('updates incorrectly without row locking', async () => {
    const query = 'select * from person where id = $1'
    const p1 = processor('one', query)
    const p2 = processor('two', query)
    const p3 = processor('three', query)

    await Promise.all([p1(), p2(), p3()])

    const details = await runInPoolClient(pool)((client) =>
      client
        .query('select details from person where id = $1', [id])
        .then(({ rows }) => rows[0].details),
    )

    expect(Object.keys(details).length).toBe(3)
  })

  it('updates correctly with row locking', async () => {
    const query = 'select * from person where id = $1 for update'
    const p1 = processor('one', query)
    const p2 = processor('two', query)
    const p3 = processor('three', query)

    await Promise.all([p1(), p2(), p3()])

    const details = await runInPoolClient(pool)((client) =>
      client
        .query('select details from person where id = $1', [id])
        .then(({ rows }) => rows[0].details),
    )

    expect(details).toEqual({
      firstName: 'test-name',
      lastName: 'test-surname',
      one: true,
      three: true,
      two: true,
    })
  })
})
