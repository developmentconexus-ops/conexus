import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import { CompanyId, ConnectionId, PersonId, ProjectId, RunId } from '@conexus/hub-api'
import { CONNECTOR_CALLS_PER_TURN } from '../connectors/test-app-calls.ts'
import { linkMercadoLivre, mercadoLivreOn } from '../connectors/test-connections.ts'
import { call, memberOn, post } from '../identity/test-hub.ts'
import { listProposalsOn } from './test-list-proposals.ts'
import { callsOf, catalogWith, ITEMS_COPY, ordersCopy, STORE_A, STORE_B } from './test-sources.ts'

const CHANGED_FROM = 'order.date_last_updated.from'

function issuesOf(answer: unknown): string {
  return JSON.stringify(answer)
}

test('a definição contra a leitura', async (t) => {
  const on = await listProposalsOn(t)
  const orders = ordersCopy(true)
  const refusals: [string, unknown][] = [
    [
      'definition.source.operation: pedido is not a read of mercado-livre that lists rows',
      { ...orders, source: { ...orders.source, operation: 'pedido' } },
    ],
    [
      'definition.changedSince: anuncios does not filter by change',
      {
        ...ITEMS_COPY,
        columns: [...ITEMS_COPY.columns, { name: 'criado', type: 'timestamp', path: 'x' }],
        changedSince: { column: 'criado' },
      },
    ],
    [
      "definition.changedSince.column: its column's path is date_last_updated",
      {
        ...orders,
        columns: orders.columns.map((column) =>
          column.name === 'atualizado' ? { ...column, path: 'date_created' } : column,
        ),
      },
    ],
    [
      "definition.source.input.offset: the copy's paging fills offset",
      { ...orders, source: { ...orders.source, input: { offset: 5 } } },
    ],
    [
      'definition.source.input.changedFrom',
      { ...orders, source: { ...orders.source, input: { changedFrom: '2026-01-01T00:00:00Z' } } },
    ],
    [
      'definition.source.input.status: ',
      { ...orders, source: { ...orders.source, input: { status: 'perdido' } } },
    ],
    ['Unrecognized key', { ...orders, window: { column: 'atualizado', days: 3 } }],
  ]
  for (const [expected, definition] of refusals) {
    const answer = await on.propose({ definition })
    assert.equal(answer.kind, 'MALFORMED', `${expected}: ${issuesOf(answer)}`)
    assert.ok(issuesOf(answer).includes(expected), `${expected}: ${issuesOf(answer)}`)
  }
  assert.deepEqual(on.door.seen, [], 'a refused definition calls nothing')
  assert.deepEqual(await on.proposalRows(), [])
  const fixed = { ...orders, source: { ...orders.source, input: { status: 'paid' } } }
  assert.equal((await on.propose({ definition: fixed })).kind, 'PROPOSED')
})

test('a prova conta e não mostra', async (t) => {
  const on = await listProposalsOn(t)
  const answer = await on.propose()
  assert.equal(answer.kind, 'PROPOSED', issuesOf(answer))
  if (answer.kind !== 'PROPOSED') return
  for (const store of [STORE_A, STORE_B]) {
    const [first, changed, ...more] = callsOf(on.door, store)
    assert.equal(more.length, 0, 'two pages of proof per connection')
    assert.equal(first?.searchParams.has(CHANGED_FROM), false, 'the first page reads everything')
    assert.equal(first?.searchParams.get('limit'), '50')
    const since = Date.parse(changed?.searchParams.get(CHANGED_FROM) ?? '')
    assert.ok(Math.abs(Date.now() - 86_400_000 - since) < 60_000, 'the second, the last day')
  }
  assert.equal(answer.counts.length, 2)
  for (const counts of answer.counts) {
    assert.deepEqual(
      { ...counts, changedLastDay: typeof counts.changedLastDay },
      {
        rows: 50,
        more: true,
        keyNull: 0,
        keyRepeated: 0,
        nulls: { id: 0, status: 0, atualizado: 0 },
        misfits: { id: 0, status: 0, atualizado: 0 },
        total: 120,
        callsPerPass: 3,
        changedLastDay: 'number',
      },
    )
  }
  assert.deepEqual(
    { rows: answer.rows, more: answer.more, calls: answer.calls },
    { rows: 50, more: true, calls: 6 },
  )
  assert.deepEqual(answer.source, {
    kind: 'OPERATION',
    operation: 'pedidos',
    label: 'Pedidos',
    input: {},
  })
  const [row] = await on.proposalRows()
  assert.deepEqual(
    [row?.proved_rows, row?.proved_more, row?.proved_calls],
    [50, true, 6],
    'the row keeps the counts',
  )
  // No row of the source leaves: the answer is counts, and no table was made.
  const text = JSON.stringify(answer)
  assert.doesNotMatch(text, /date_last_updated|"status":"(paid|cancelled)"/)
  const tables = await on.hub.test.asOwner('select count(*)::int as n from copies.copy')
  assert.equal(tables[0]?.n, 0)
})

test('a prova conta e não mostra: as recusas da prova', async (t) => {
  const on = await listProposalsOn(t)
  const repeated = ordersCopy(false)
  repeated.columns = repeated.columns.map((column) =>
    column.name === 'id' ? { ...column, path: 'status', type: 'text' } : column,
  )
  const notUnique = await on.propose({ definition: repeated, name: 'repetida' })
  assert.equal(notUnique.kind, 'KEY_NOT_UNIQUE', issuesOf(notUnique))
  assert.equal(Object(notUnique).connection, 'Loja A')
  assert.ok(Object(notUnique).keyRepeated > 0)
  const nullKey = ordersCopy(false)
  nullKey.columns = nullKey.columns.map((column) =>
    column.name === 'id' ? { ...column, path: 'nao_existe' } : column,
  )
  const keyNull = await on.propose({ definition: nullKey, name: 'nula' })
  assert.deepEqual(keyNull, {
    kind: 'KEY_NOT_UNIQUE',
    connection: 'Loja A',
    keyNull: 50,
    keyRepeated: 0,
  })
  const misfit = ordersCopy(false)
  misfit.columns = misfit.columns.map((column) =>
    column.name === 'status' ? { ...column, type: 'bigint' } : column,
  )
  const typed = await on.propose({ definition: misfit, name: 'torta' })
  assert.deepEqual(typed, {
    kind: 'TYPE_MISFIT',
    connection: 'Loja A',
    column: 'status',
    count: 50,
  })
  assert.deepEqual(await on.proposalRows(), [], 'a refused proof keeps nothing')

  // Each call counts in the run's 50.
  const runId = RunId.parse(randomUUID())
  for (let spent = 0; spent < CONNECTOR_CALLS_PER_TURN - 1; spent += 1) {
    // A read the kit's schema refuses before the provider: it still spends one of the run's calls.
    const read = await on.hub.connectors.builder.read(
      { companyId: on.companyId, projectId: on.projectId },
      {
        connectionId: on.store(STORE_A.ref),
        personId: on.anaId,
        runId,
        operation: 'pedidos',
        input: { limit: 999 },
      },
    )
    assert.equal(read.kind, 'REFUSED')
  }
  assert.deepEqual(await on.propose({ runId, name: 'gasta' }), { kind: 'CALLS_SPENT' })
})

test('várias contas', async (t) => {
  const on = await listProposalsOn(t)
  const [storeA, storeB] = on.both
  assert.ok(storeA && storeB)
  const proposed = await on.propose()
  assert.equal(proposed.kind, 'PROPOSED', issuesOf(proposed))
  assert.deepEqual(Object(proposed).sources, [
    { name: 'Loja A', connector: 'mercado-livre' },
    { name: 'Loja B', connector: 'mercado-livre' },
  ])
  const [row] = await on.proposalRows()
  assert.deepEqual(row?.sources, [...on.both].sort())
  // A connection that is not released to the Projeto.
  const url = `/api/companies/${on.companyId}/projects/${on.projectId}/connections/${storeB}`
  assert.equal((await call(on.hub, on.ana, 'DELETE', url)).statusCode, 204)
  assert.deepEqual(await on.propose({ name: 'sem_b' }), { kind: 'NOT_GRANTED' })
  assert.equal((await call(on.hub, on.ana, 'PUT', url)).statusCode, 200)
  // A role that does not use the read: refused with its name, and nothing is read.
  const role = { label: 'Perguntas', connectors: { 'mercado-livre': ['perguntas'] } }
  const created = await post(on.hub, on.ana, `/api/companies/${on.companyId}/roles`, role)
  assert.equal(created.statusCode, 201, created.body)
  const who = { name: 'Enzo Alves', email: 'enzo@example.test' }
  const enzo = await memberOn(on.hub, on.companyId, who, 'perguntas')
  on.door.seen.length = 0
  const refused = await on.propose({ name: 'do_enzo', personId: PersonId.parse(enzo.id) })
  assert.deepEqual(refused, { kind: 'NOT_IN_ROLE', role: 'perguntas', operation: 'Pedidos' })
  assert.deepEqual(on.door.seen, [])
  // The same connection twice, and a connection of another connector.
  const twice = await on.propose({ name: 'duas', connections: [storeA, storeA] })
  assert.match(issuesOf(twice), /"kind":"MALFORMED".*connections: A connection is named once/)
  assert.equal((await on.proposalRows()).length, 1)
})

test('várias contas: um conector sem conta lê uma conexão só', async (t) => {
  const accountless = catalogWith((connector) => ({ ...connector, account: { kind: 'none' } }))
  const on = await mercadoLivreOn(t, { tuning: { catalog: accountless } })
  const ids: unknown[] = []
  for (const [name, store] of [
    ['Loja A', STORE_A],
    ['Loja B', STORE_B],
  ] as const) {
    on.fake.switches.account = store
    const linked = await linkMercadoLivre(on.hub, on.ana, on.companyId, {
      connector: 'mercado-livre',
      name,
    })
    assert.equal(Object(linked.json()).result, 'LINKED', linked.body)
    ids.push(Object(linked.json()).connection?.id)
  }
  const made = await post(on.hub, on.ana, `/api/companies/${on.companyId}/projects`, {
    name: 'Pedidos',
  })
  const projectId = ProjectId.parse(Object(made.json()).project.id)
  const answer = await on.hub.connectors.builder.propose(
    { companyId: CompanyId.parse(on.companyId), projectId },
    {
      connections: ids.map((id) => ConnectionId.parse(id)),
      personId: PersonId.parse(on.ana.id),
      runId: RunId.parse(randomUUID()),
      name: 'ml_pedidos',
      label: 'Pedidos',
      definition: ordersCopy(true),
      signal: new AbortController().signal,
    },
  )
  assert.match(issuesOf(answer), /"kind":"MALFORMED".*has no account to tell connections apart/)
})

test('o registro não leva dado', async (t) => {
  const on = await listProposalsOn(t)
  const fixed = ordersCopy(true)
  const definition = { ...fixed, source: { ...fixed.source, input: { status: 'paid' } } }
  assert.equal((await on.propose({ definition })).kind, 'PROPOSED')
  const line = on.hub.lines.find((each) => each.message === 'COPY_PROPOSED')
  assert.ok(line)
  assert.deepEqual(Object.keys(line.fields).sort(), [
    'calls',
    'companyId',
    'connectionIds',
    'more',
    'projectId',
    'proposalId',
    'rows',
  ])
  assert.ok(Object.values(line.fields).every((value) => typeof value !== 'object'))
  const written = JSON.stringify(on.hub.lines)
  for (const kept of ['paid', 'date_last_updated', 'Os pedidos de cada loja'])
    assert.ok(!written.includes(kept), kept)
})
