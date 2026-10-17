import assert from 'node:assert/strict'
import type { Socket } from 'node:net'
import { connect, createServer } from 'node:net'
import { test } from 'node:test'
import { setTimeout } from 'node:timers/promises'
import { CompanyId, PersonId } from '@conexus/hub-api'
import { sql } from 'drizzle-orm'
import { DatabaseUrl, openDatabase } from './database.ts'
import {
  createTestDatabase,
  silent,
  unreachableDatabaseUrl,
  whenIdle,
  withRoleLock,
} from './test-database.ts'

function failsWith(code: string, sqlstate?: string) {
  return (error: unknown) => {
    assert.ok(error instanceof Error && 'code' in error, 'not a Failure')
    assert.equal(error.code, code)
    if (sqlstate !== undefined) {
      assert.ok(error.cause instanceof Error && 'code' in error.cause)
      assert.equal(error.cause.code, sqlstate)
    }
    return true
  }
}

test('depois de uma leitura o pool chega a zero conexões', async (t) => {
  const { database, asOwner } = await createTestDatabase(t)
  const countRuntime = `select count(*)::int as open from pg_stat_activity
    where datname = current_database() and usename = 'hub_runtime'`
  const read = await database.installation((tx) => tx.execute(sql`select 1 as one`))
  assert.deepEqual(read.rows, [{ one: 1 }])
  assert.deepEqual(await asOwner(countRuntime), [{ open: 1 }])
  await whenIdle(database)
  assert.deepEqual(await asOwner(countRuntime), [{ open: 0 }])
})

test('uma leitura não escreve', async (t) => {
  const { database } = await createTestDatabase(t)
  await assert.rejects(
    database.read({ kind: 'PERSON', personId: PersonId.parse('someone') }, (tx) =>
      tx.execute(sql`create temp table scratch (id int)`),
    ),
    failsWith('INTERNAL_UNEXPECTED', '25006'),
  )
})

test('asPerson: a falha da consulta é a que sobe, não a da volta ao escopo da empresa', async (t) => {
  const { database } = await createTestDatabase(t)
  const scope = {
    kind: 'COMPANY',
    companyId: CompanyId.parse('companyAAAAAAAAAAAAAAAAAAAAAAAAA'),
    personId: PersonId.parse('someone'),
  } as const
  await assert.rejects(
    database.command(scope, (tx) =>
      database.asPerson(tx, (inner) => inner.execute(sql`select 1 / 0`)),
    ),
    failsWith('INTERNAL_UNEXPECTED', '22012'),
  )
  const back = await database.command(scope, async (tx) => {
    await database
      .asPerson(tx, async () => {
        throw new Error('the work failed')
      })
      .catch(() => undefined)
    return (await tx.execute(sql`select current_user as role`)).rows
  })
  assert.deepEqual(back, [{ role: 'hub_company' }])
})

test('o tempo do comando acaba como banco fora, pelo código do erro', async (t) => {
  const { database } = await createTestDatabase(t)
  await assert.rejects(
    database.installation(async (tx) => {
      await tx.execute(sql`set local statement_timeout = '50ms'`)
      return tx.execute(sql`select pg_sleep(5)`)
    }),
    failsWith('DATABASE_UNAVAILABLE', '57014'),
  )
})

test('um erro de SQL que não é queda vira erro inesperado', async (t) => {
  const { database } = await createTestDatabase(t)
  await assert.rejects(
    database.installation((tx) => tx.execute(sql`select * from nowhere`)),
    failsWith('INTERNAL_UNEXPECTED', '42P01'),
  )
})

test('o banco inalcançável vira DATABASE_UNAVAILABLE', async () => {
  const database = openDatabase({ url: await unreachableDatabaseUrl(), log: silent })
  await assert.rejects(
    database.installation((tx) => tx.execute(sql`select 1`)),
    failsWith('DATABASE_UNAVAILABLE'),
  )
  await database.close()
})

test('o objeto é congelado e fechar duas vezes é seguro', async (t) => {
  const { database } = await createTestDatabase(t)
  assert.ok(Object.isFrozen(database))
  await database.close()
  await database.close()
})

test('a conexão derrubada no meio de um comando vira DATABASE_UNAVAILABLE e o processo segue', async (t) => {
  const { database, asOwner } = await createTestDatabase(t)
  const started = Promise.withResolvers<number>()
  const running = database.installation(async (tx) => {
    const backend = await tx.execute(sql`select pg_backend_pid()::int as pid`)
    started.resolve(Number(backend.rows[0]?.pid))
    return tx.execute(sql`select pg_sleep(30)`)
  })
  const refused = assert.rejects(running, failsWith('DATABASE_UNAVAILABLE'))
  const pid = await started.promise
  // Ending another login's backend needs its privileges, which the owner holds only for this moment.
  await withRoleLock(async () => {
    await asOwner('grant hub_runtime to current_user')
    try {
      await asOwner('select pg_terminate_backend($1)', [pid])
    } finally {
      await asOwner('revoke hub_runtime from current_user')
    }
  })
  await refused
  const next = await database.installation((tx) => tx.execute(sql`select 1 as one`))
  assert.deepEqual(next.rows, [{ one: 1 }])
})

test('uma leitura parada além do prazo: 503, o soquete destruído solta as travas e a conexão não volta ao pool', async (t) => {
  const { database, asOwner } = await createTestDatabase(t)
  const holder = asOwner('select pg_advisory_xact_lock(777), pg_sleep(60)').catch(
    (error: unknown) => error,
  )
  // The read must find 777 taken: it starts once the holder has it, never on a guess of when.
  const held = `select count(*)::int as held from pg_locks
    where locktype = 'advisory' and objid = 777 and granted`
  const deadline = Date.now() + 5_000
  while (Object((await asOwner(held))[0]).held === 0) {
    assert.ok(Date.now() < deadline, 'the holder never took lock 777')
    await setTimeout(20)
  }
  const started = Date.now()
  try {
    await assert.rejects(
      database.installation(async (tx) => {
        await tx.execute(sql`set local statement_timeout = 0`)
        await tx.execute(sql`select pg_advisory_xact_lock(888)`)
        return tx.execute(sql`select pg_advisory_xact_lock(777)`)
      }),
      failsWith('DATABASE_UNAVAILABLE'),
    )
    assert.ok(Date.now() - started >= 15_000, 'the read deadline is 15 s')
  } finally {
    await asOwner(`select pg_cancel_backend(pid) from pg_stat_activity
      where query like 'select pg_advisory_xact_lock(777), pg_sleep(60)%'`)
  }
  assert.equal(Object(await holder).code, '57014')
  assert.deepEqual(await asOwner('select pg_advisory_xact_lock(888)::text as held'), [{ held: '' }])
  const next = await database.installation((tx) => tx.execute(sql`select 1 as one`))
  assert.deepEqual(next.rows, [{ one: 1 }])
})

test('um erro do próprio programa na consulta não vira banco fora', async (t) => {
  const { database } = await createTestDatabase(t)
  const circular: Record<string, unknown> = {}
  circular.self = circular
  await assert.rejects(
    database.installation((tx) => tx.execute(sql`select ${circular}::text`)),
    failsWith('INTERNAL_UNEXPECTED'),
  )
})

test('o Drizzle da biblioteca usa o mesmo pool, que chega a zero conexões depois', async (t) => {
  const { database, asOwner } = await createTestDatabase(t)
  const countRuntime = `select count(*)::int as open from pg_stat_activity
    where datname = current_database() and usename = 'hub_runtime'`
  const read = await database.libraryOrm({}).execute(sql`select current_user as login`)
  assert.deepEqual(read.rows, [{ login: 'hub_runtime' }])
  await whenIdle(database)
  assert.deepEqual(await asOwner(countRuntime), [{ open: 0 }])
})

/** A TCP proxy to the database that, once `hold` is called, keeps every reply from reaching the Hub. */
async function replyHolder(target: DatabaseUrl) {
  const url = new URL(target.reveal())
  const port = Number(url.port)
  const host = url.hostname
  const sockets: Socket[] = []
  const state = { held: false }
  const server = createServer((hub) => {
    const database = connect(port, host)
    sockets.push(hub, database)
    hub.on('data', (chunk) => database.write(chunk))
    database.on('data', (chunk) => {
      if (!state.held) hub.write(chunk)
    })
    for (const socket of [hub, database]) socket.on('error', () => undefined)
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  assert.ok(address !== null && typeof address === 'object')
  url.hostname = '127.0.0.1'
  url.port = String(address.port)
  return {
    url: DatabaseUrl.parse(url.toString()),
    hold: () => {
      state.held = true
    },
    close: () => {
      for (const socket of sockets) socket.destroy()
      server.close()
    },
  }
}

test('uma consulta da biblioteca sem resposta cai no prazo de 15 s como conexão perdida, e o pool a solta', async (t) => {
  const { runtimeUrl } = await createTestDatabase(t)
  const proxy = await replyHolder(runtimeUrl)
  const database = openDatabase({ url: proxy.url, log: silent })
  const orm = database.libraryOrm({})
  try {
    assert.deepEqual((await orm.execute(sql`select 1 as one`)).rows, [{ one: 1 }])
    proxy.hold()
    const started = Date.now()
    const read = orm.execute(sql`select 1 as one`).then(
      () => 'answered',
      (error: unknown) => (error instanceof Error ? String(Object(error.cause).message) : 'thrown'),
    )
    const outcome = await Promise.race([read, setTimeout(17_000, 'pending', { ref: false })])
    assert.equal(outcome, 'Connection terminated unexpectedly')
    assert.ok(Date.now() - started >= 15_000, 'the deadline is 15 s')
    assert.equal(orm.$client.totalCount, 0)
  } finally {
    proxy.close()
    await database.close()
  }
})
