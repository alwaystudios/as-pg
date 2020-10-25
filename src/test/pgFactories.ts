import { PoolClient, QueryResult, Pool } from 'pg'

export const testConnectionPool = ({
  connect = jest.fn(),
  query = jest.fn(),
}: {
  connect?: () => Promise<PoolClient>
  query?: () => Promise<QueryResult>
} = {}): Pool => {
  return ({
    connect,
    query,
  } as any) as Pool
}

export const testPgPool = ({
  connect = jest.fn(),
  query = jest.fn(),
}: {
  connect?: () => Promise<PoolClient>
  query?: () => Promise<QueryResult>
} = {}): Pool => {
  return ({
    connect,
    query,
  } as any) as Pool
}

export const testPgClient = ({
  query = jest.fn(),
  release = jest.fn(),
}: {
  query?: () => Promise<QueryResult>
  release?: () => void
} = {}): PoolClient => {
  return ({
    query,
    release,
  } as any) as PoolClient
}

export const testQueryResults = (queryResults: Partial<QueryResult> = {}): QueryResult => ({
  rowCount: queryResults.rowCount === undefined ? 1 : queryResults.rowCount,
  rows: queryResults.rows || [],
  command: '',
  fields: [],
  oid: 1,
})

export const testRunInPoolClient = (client = testPgClient()) => async <T>(
  f: (_: PoolClient) => Promise<T>,
): Promise<T> => f(client)

export const testRunInTransaction = (client = testPgClient()) => async <T>(
  f: (_: PoolClient) => Promise<T>,
): Promise<T> => f(client)
