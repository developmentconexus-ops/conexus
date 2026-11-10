import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import { ConnectionId, PersonId } from '@conexus/hub-api'
import { sql } from 'drizzle-orm'
import pg from 'pg'
import { CopyName } from '../connectors/public.ts'
import type { CopiesOn } from './test-copies.ts'

import { asSync, copiesOn } from './test-copies.ts'

async function refusedWith(code: string, act: () => Promise<unknown>) {
  await assert.rejects(act, (error: unknown) => Object(error).code === code)
}

async function copiesOf(on: CopiesOn) {
  const result = await on.hub.test.database.read(
    { kind: 'COMPANY', companyId: on.companyId, personId: null },
    (tx) => tx.execute(sql`select id, name, label, model, definition from copies.copy`),
  )
  return result.rows.map((row) => Object(row))
}

/** The copy's table as its owner, the sync login, sees it: each column and its type, the key, and who owns it. */
function tableOf(on: CopiesOn, name: string) {
  return asSync(on.owner, async (client) => {
    const columns = await client.query(
      `select attname, format_type(atttypid, atttypmod) as type from pg_attribute
        where attrelid = $1::regclass and attnum > 0 and not attisdropped order by attnum`,
      [`sync.${name}`],
    )
    const key = await client.query(
      `select a.attname from pg_index i join pg_attribute a on a.attrelid = i.indrelid and a.attnum = any(i.indkey)
        where i.indrelid = $1::regclass and i.indisprimary order by array_position(i.indkey, a.attnum)`,
      [`sync.${name}`],
    )
    const owner = await client.query(
      `select tableowner from pg_tables where schemaname = 'sync' and tablename = $1`,
      [name],
    )
    return {
      columns: columns.rows.map((row) => `${row.attname} ${row.type}`),
      key: key.rows.map((row) => String(row.attname)),
      owner: String(owner.rows[0]?.tableowner),
    }
  })
}

test('ligar: a linha, o esquema e a tabela', async (t) => {
  const on = await copiesOn(t)
  const key = randomUUID()
  const copyId = await on.enable('vendas', { key })
  const [row, ...more] = await copiesOf(on)
  assert.equal(more.length, 0)
  const model = on.hub.connectors.copies.catalog().find((each) => each.model.id === 'vendas')
  assert.ok(model)
  assert.deepEqual(
    { id: row.id, name: row.name, label: row.label, model: row.model, definition: row.definition },
    {
      id: copyId,
      name: 'vendas',
      label: model.model.label,
      model: 'vendas',
      definition: model.model.definition,
    },
    'a definição igual à do modelo',
  )
  const table = await tableOf(on, 'vendas')
  assert.equal(table.owner, 'conexus_sync')
  assert.deepEqual(table.key, ['NUNOTA'])
  assert.deepEqual(table.columns.at(-1), '_pass integer')
  assert.ok(table.columns.includes('NUNOTA bigint'))
  assert.ok(table.columns.includes('DTNEG date'))
  assert.ok(table.columns.includes('DTALTER timestamp without time zone'))
  assert.ok(table.columns.includes('VLRNOTA numeric'))
  assert.deepEqual(
    on.calls.filter((call) => call.startsWith('runNow')),
    [`runNow ${copyId}`],
  )
  assert.ok(on.hub.lines.some((line) => line.message === 'COPY_ENABLED'))

  assert.equal(await on.enable('vendas', { key }), copyId, 'a mesma chave acha a mesma cópia')
  assert.equal((await copiesOf(on)).length, 1, 'nada a mais')
  await refusedWith('IDEMPOTENCY_CONFLICT', () => on.enable('vendas', { key, interval: '1h' }))
  await refusedWith('IDEMPOTENCY_CONFLICT', () => on.enable('clientes', { key }))
})

async function connectionState(on: CopiesOn, state: string) {
  const client = new pg.Client({ connectionString: on.hub.test.ownerUrl.reveal() })
  await client.connect()
  try {
    await client.query('update connectors.connection set state = $1 where id = $2', [
      state,
      on.connectionId,
    ])
  } finally {
    await client.end()
  }
}

test('ligar: as recusas', async (t) => {
  const on = await copiesOn(t)
  await on.enable('vendas')
  await refusedWith('COPY_EXISTS', () => on.enable('vendas'))
  await refusedWith('COPY_MODEL_UNKNOWN', () => on.enable('nao_existe'))
  await refusedWith('NOT_FOUND', () =>
    on.copies.enable({
      ...{ companyId: on.companyId, personId: on.anaId },
      connectionId: ConnectionId.parse(randomUUID()),
      source: { kind: 'MODEL', model: CopyName.parse('clientes') },
      interval: '30m',
      attemptKey: randomUUID(),
    }),
  )
  await refusedWith('NOT_FOUND', () =>
    on.copies.enable({
      ...{ companyId: on.companyId, personId: PersonId.parse(on.carla.id) },
      connectionId: on.connectionId,
      source: { kind: 'MODEL', model: CopyName.parse('clientes') },
      interval: '30m',
      attemptKey: randomUUID(),
    }),
  )
  await connectionState(on, 'NEEDS_REAUTH')
  await refusedWith('COPY_CONNECTION_NOT_READY', () => on.enable('clientes'))
  assert.equal((await copiesOf(on)).length, 1)
})

test('ligar: o Hub atualizando recusa antes de tudo', async (t) => {
  const on = await copiesOn(t)
  on.hubState.updating = true
  await refusedWith('HUB_UPDATING', () => on.enable('vendas'))
  assert.equal((await copiesOf(on)).length, 0, 'nem a linha')
  assert.deepEqual(on.calls, [])
})

test('ligar: repetir com a mesma chave não pede outra rodada', async (t) => {
  const on = await copiesOn(t)
  const key = randomUUID()
  const copyId = await on.enable('vendas', { key })
  assert.equal(await on.enable('vendas', { key }), copyId)
  assert.deepEqual(
    on.calls.filter((call) => call.startsWith('runNow')),
    [`runNow ${copyId}`],
  )
})

test('ligar: o banco da empresa cai no meio', async (t) => {
  const on = await copiesOn(t)
  const key = randomUUID()
  on.hub.neon.script('ownerConnection', 'NO_ANSWER')
  await refusedWith('COPY_DATABASE_UNAVAILABLE', () => on.enable('produtos', { key }))
  const [kept] = await copiesOf(on)
  assert.equal(kept?.name, 'produtos', 'a linha fica')
  assert.equal(on.calls.length, 0, 'o relógio só depois da tabela')
  const copyId = await on.enable('produtos', { key })
  assert.equal(copyId, kept.id, 'a mesma chave termina o que faltou')
  assert.deepEqual((await tableOf(on, 'produtos')).key, ['CODPROD'])
  assert.deepEqual(
    on.calls.filter((call) => call.startsWith('runNow')),
    [`runNow ${copyId}`],
  )
})
