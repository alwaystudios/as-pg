import { Pool, PoolClient, QueryResult } from 'pg'

export const runInPoolClient = (pool: Pool) => async <T>(
  f: (client: PoolClient) => Promise<T>,
): Promise<T> => pool.connect().then((client) => f(client).finally(client.release))

export const verifyAtLeastOneRow = (operation: string) => (queryResult: QueryResult): void => {
  if (queryResult.rowCount === 0) {
    throw new Error(`Expected ${operation} to have row count of at least one`)
  }
}
