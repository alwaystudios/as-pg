import { Pool, PoolClient, QueryResult } from 'pg'

const handleError = (errorMessage: string) => (error: Error) => {
  throw new Error(`${errorMessage}: ${error.message}`)
}

const beginPgTransaction = (client: PoolClient): Promise<QueryResult> =>
  client.query('BEGIN').catch(handleError('Failed to begin transaction'))

const commitPgTransaction = (client: PoolClient): Promise<QueryResult> =>
  client.query('COMMIT').catch(handleError('Failed to commit transaction'))

const rollbackPgTransaction = async (client: PoolClient): Promise<void> => {
  await client.query('ROLLBACK').catch(handleError('Failed to rollback transaction'))
}

export const runInTransaction = (pool: Pool) => async <T>(
  f: (client: PoolClient) => Promise<T>,
): Promise<T> =>
  pool.connect().then((client) =>
    beginPgTransaction(client)
      .then(() => f(client))
      .then(async (res) => {
        await commitPgTransaction(client)
        return res
      })
      .catch(async (err) => {
        await rollbackPgTransaction(client)
        throw err
      })
      .finally(client.release),
  )
