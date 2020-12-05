import { concatenate } from '@alwaystudios/as-utils'
import { PoolClient } from 'pg'
import { PollerRecordType } from './dbPoller'

export const getPollerRecords = async <T extends PollerRecordType>(
  client: PoolClient,
  table: string,
  batchSize?: number,
): Promise<T[]> => {
  const batchClause = batchSize !== undefined ? 'limit $1' : ''
  const sql = `select * from ${table} where coalesce(processed,false)=false order by id asc ${batchClause} for update`
  return client
    .query(sql, batchSize ? [batchSize] : [])
    .then(({ rows = [] }) => rows)
    .catch((error) => {
      throw new Error(`Failed to get poller messages: ${error.message}`)
    })
}

export const processPollerRecords = async (
  client: PoolClient,
  table: string,
  ids: number[],
  deleteRecords: boolean,
) => {
  if (!ids.length) {
    return
  }
  const inStatement = concatenate(...ids.map((id) => `${id},`)).slice(0, -1)
  const sql = deleteRecords
    ? concatenate(`delete from ${table} where id in`, '(', inStatement, ')')
    : concatenate(`update ${table} set processed = true where id in`, '(', inStatement, ')')
  await client.query(sql).catch((error) => {
    throw new Error(`Failed to process poller messages: ${error.message}`)
  })
}
