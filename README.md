# as-pg

A Postgres utilities library

https://www.npmjs.com/package/@alwaystudios/as-pg

```
  yarn add @alwaystudios/as-pg
```

Postgres (pg) helper functions

## runInTransaction

Uses a connection pool to create a PG client and then starts a transaction allowing for multiple database operations within the transaction context.
Rolls back on failure, commits transaction on success.

```
  await runInTransaction(pool)(async (client) => {
    await client.query(someUpdateQuery1)
    await client.query(someUpdateQuery2)
  })
```

## runInPoolClient

Uses a connection pool to create a PG client.

```
  await runInPoolClient(pool)(async (client) => {
    await client.query(someQuery)
  })
```

## verifyAtLeastOneRow

Verifies a query result set to ensure at least one row was affected by a query

```
  await runInPoolClient(pool)(async (client) => {
    await client.query(someQuery).then(verifyAtLeastOneRow('my update operation'))
  })
```

## Poller processor

Creates a database poller process

```
  const onReceiveData = async <PersonRecord>(records: PersonRecord[]) => {
    console.log(records.length)
  }

  const poller = dbPollerFactory<PersonRecord>({
    pool,
    tableName: 'person',
    interval: 200,
    batchSize: 20,
    onReceiveData,
  })

  const processId = poller.schedulePoller()

  .....

  clearInterval(processId) // stop the poller
```

Factory props are as follows:

```
  {
    pool: Pool
    tableName: string
    interval: number
    batchSize: number
    onReceiveData: <T>(records: T[]) => Promise<void>
    deleteRecords?: boolean
  }
```

# Test factories

- testConnectionPool
- testPgPool
- testPgClient
- testQueryResults
- testRunInPoolClient
- testRunInTransaction
