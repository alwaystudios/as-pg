import { PoolClient, QueryResult, Pool } from 'pg'

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

export const testRunWithClient = (client: PoolClient) => async <T>(
  f: (_: PoolClient) => Promise<T>,
): Promise<T> => f(client)
