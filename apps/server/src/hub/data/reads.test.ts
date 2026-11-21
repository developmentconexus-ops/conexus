import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import {
  AgentId,
  CompanyId,
  ConnectionId,
  ConversationId,
  DataReadEntry,
  OperationId,
  ProjectId,
} from '@conexus/hub-api'
import type { Person } from '../identity/test-hub.ts'
import { call, plantCompany, post } from '../identity/test-hub.ts'
import {
  exportUrl,
  idsNewestFirst,
  listed,
  registry,
  SAMPLE,
  sampled,
  url,
  who,
} from './test-reads.ts'

test('o dono lê todas, por página, sem repetir', async (t) => {
  const w = await registry(t)
  for (let n = 0; n < 52; n += 1) await sampled(w, n % 2 === 0 ? w.ana : w.bruno)
  const first = await listed(w.hub, w.ana, url(w))
  const times = first.reads.map((read) => Date.parse(read.at))
  assert.deepEqual(
    times,
    [...times].sort((a, b) => b - a),
  )
  // Most rows on one instant: only the id orders them, across the page's end too.
  await w.hub.test.asOwner(
    `update data.data_read set at = (select max(at) from data.data_read where company_id = $1)
      where company_id = $1 and id not in
        (select id from data.data_read where company_id = $1 order by at limit 10)`,
    [w.companyId],
  )
  const one = await listed(w.hub, w.ana, url(w))
  assert.equal(one.reads.length, 50)
  assert.equal(one.next.kind, 'MORE')
  assert.ok(one.next.kind === 'MORE')
  const two = await listed(w.hub, w.ana, url(w, `?page=${one.next.page}`))
  assert.deepEqual(two.next, { kind: 'END' })
  const seen = [...one.reads, ...two.reads].map((read) => read.id)
  assert.deepEqual(seen, await idsNewestFirst(w))
  assert.equal(new Set(seen).size, 52)
})

test('só Dono e Administrador leem o Registro', async (t) => {
  const w = await registry(t)
  await sampled(w, w.bruno)
  await sampled(w, w.carla)
  await sampled(w, w.ana)
  const owner = await listed(w.hub, w.ana, url(w))
  const admin = await listed(w.hub, w.dora, url(w))
  assert.equal(owner.reads.length, 3)
  assert.deepEqual(admin, owner)
  const outside = await call(w.hub, w.ana, 'GET', url(w, '', 'empresaQueNaoExiste0000000000000'))
  assert.equal(outside.statusCode, 404)
  const day = exportUrl(w, '2026-11-01T00:00:00.000Z', '2026-11-02T00:00:00.000Z')
  for (const person of [w.bruno, w.carla]) {
    for (const address of [url(w), url(w, `?person=${person.id}`), day]) {
      const refused = await call(w.hub, person, 'GET', address)
      assert.equal(refused.statusCode, 404, address)
      const { traceId: _, ...body } = Object(refused.json())
      const { traceId: __, ...unknown } = Object(outside.json())
      assert.deepEqual(body, unknown)
      assert.doesNotMatch(refused.body, /sankhya_vendas/)
    }
  }
  async function may(person: Person) {
    const read = await call(w.hub, person, 'GET', `/api/companies/${w.companyId}`)
    return Object(Object(read.json()).may).readDataReads
  }
  assert.deepEqual(
    [await may(w.ana), await may(w.dora), await may(w.bruno), await may(w.carla)],
    [true, true, false, false],
  )
})

test('os filtros recortam', async (t) => {
  const w = await registry(t)
  await sampled(w, w.bruno)
  await sampled(w, w.bruno, 'sankhya_clientes', 'NOT_IN_CATALOG')
  await sampled(w, w.ana, 'sankhya_clientes', 'TABLE_UNAVAILABLE')
  const sql = 'select * from sync.sankhya_produtos join sync.sankhya_itens_venda using (id)'
  const queried = { ...who(w, w.ana), by: 'builder' as const }
  const query = { verb: 'QUERY', query: sql, connectionId: null, operation: null } as const
  const read = ['sankhya_produtos', 'sankhya_itens_venda']
  await w.record({ ...queried, ...query, tables: read, outcome: 'QUERY', rows: 3, ms: 2 })
  await w.record({ ...queried, ...query, tables: [], outcome: 'NOT_IN_ROLE', rows: null, ms: 2 })
  async function tablesOf(query: string) {
    const { reads } = await listed(w.hub, w.ana, url(w, query))
    return reads.map((read) => [read.outcome, ...read.tables])
  }
  assert.deepEqual(await tablesOf(`?person=${w.bruno.id}`), [
    ['NOT_IN_CATALOG', 'sankhya_clientes'],
    ['TABLE', 'sankhya_vendas'],
  ])
  assert.deepEqual(await tablesOf('?agent=BUILDER'), [
    ['NOT_IN_ROLE'],
    ['QUERY', 'sankhya_produtos', 'sankhya_itens_venda'],
  ])
  assert.deepEqual(await tablesOf('?table=sankhya_itens_venda'), [
    ['QUERY', 'sankhya_produtos', 'sankhya_itens_venda'],
  ])
  assert.deepEqual(await tablesOf('?outcome=READ'), [
    ['QUERY', 'sankhya_produtos', 'sankhya_itens_venda'],
    ['TABLE', 'sankhya_vendas'],
  ])
  assert.deepEqual(await tablesOf('?outcome=NOT_FOUND'), [['NOT_IN_CATALOG', 'sankhya_clientes']])
  assert.deepEqual(await tablesOf('?outcome=REFUSED'), [['NOT_IN_ROLE']])
  assert.deepEqual(await tablesOf('?outcome=NOT_READ'), [['TABLE_UNAVAILABLE', 'sankhya_clientes']])
  assert.deepEqual(await tablesOf(`?person=${w.bruno.id}&outcome=READ`), [
    ['TABLE', 'sankhya_vendas'],
  ])
  const malformed = await call(w.hub, w.ana, 'GET', url(w, '?outcome=OK'))
  assert.equal(malformed.statusCode, 400)
})

test('os nomes vêm num lote', async (t) => {
  const w = await registry(t)
  const projects = `/api/companies/${w.companyId}/projects`
  const made = await post(w.hub, w.ana, projects, { name: 'Vendedores' })
  assert.equal(made.statusCode, 201, made.body)
  const projectId = ProjectId.parse(Object(made.json()).project.id)
  const gone = ProjectId.parse('projetoApagado000000000000000000')
  const thread = ConversationId.parse(randomUUID())
  const agentId = AgentId.parse(randomUUID())
  const inProject = {
    ...who(w, w.bruno),
    projectId,
    threadId: thread,
    by: 'agent' as const,
    agentId,
  }
  await w.record({
    ...inProject,
    ...SAMPLE,
    tables: ['sankhya_vendas'],
    outcome: 'TABLE',
    rows: 2,
    ms: 4,
  })
  await w.record({
    ...who(w, w.carla),
    projectId: gone,
    ...SAMPLE,
    tables: ['x'],
    outcome: 'TABLE',
    rows: 0,
    ms: 1,
  })
  const live = { verb: 'LIVE', tables: [], query: null, rows: null } as const
  const connection = ConnectionId.parse(randomUUID())
  const operation = OperationId.parse('lerPedidos')
  await w.record({
    ...who(w, w.ana),
    ...live,
    connectionId: connection,
    operation,
    outcome: 'OK',
    ms: 9,
  })
  const reads = (await listed(w.hub, w.ana, url(w))).reads
  assert.deepEqual(
    reads.map((read) => [read.person.name, read.agent, read.project, read.agentId, read.threadId]),
    [
      ['Ana Lima', 'ASSISTANT', null, null, null],
      ['Carla Dias', 'ASSISTANT', { id: gone, name: null }, null, null],
      ['Bruno Reis', 'AGENT', { id: projectId, name: 'Vendedores' }, agentId, thread],
    ],
  )
  assert.deepEqual(
    [reads[0]?.connection, reads[0]?.operation, reads[0]?.verb],
    [connection, operation, 'LIVE'],
  )
})

test('a resposta passa no esquema sem linhas', async (t) => {
  const w = await registry(t)
  const sql = "select nome from sync.sankhya_vendas where nome = 'MARCA-1'"
  const query = { verb: 'QUERY', connectionId: null, operation: null } as const
  await w.record({
    ...who(w, w.ana),
    ...query,
    query: sql,
    tables: ['sankhya_vendas'],
    outcome: 'QUERY',
    rows: 1,
    ms: 5,
  })
  await sampled(w, w.ana)
  const response = await call(w.hub, w.ana, 'GET', url(w))
  assert.equal(response.statusCode, 200)
  const reads: unknown[] = Object(response.json()).reads
  assert.deepEqual(Object.keys(DataReadEntry.shape).sort(), [
    ...['agent', 'agentId', 'at', 'connection', 'id', 'ms', 'operation', 'outcome', 'person'],
    ...['project', 'query', 'rows', 'tables', 'threadId', 'verb'],
  ])
  for (const read of reads) DataReadEntry.strict().parse(read)
  assert.deepEqual(
    reads.map((read) => Object(read).query),
    [null, sql],
  )
})

test('fora da empresa, não encontrado', async (t) => {
  const w = await registry(t)
  await sampled(w, w.ana)
  const day = exportUrl(w, '2026-11-01T00:00:00.000Z', '2026-11-02T00:00:00.000Z')
  for (const address of [url(w), day]) {
    const refused = await call(w.hub, w.edu, 'GET', address)
    assert.equal(refused.statusCode, 404, address)
    assert.equal(Object(refused.json()).code, 'NOT_FOUND')
  }
  const other = CompanyId.parse(await plantCompany(w.hub.test, w.edu.id, 'Empresa B'))
  const theirs = await listed(w.hub, w.edu, url(w, '', other))
  assert.deepEqual(theirs, { reads: [], next: { kind: 'END' } })
  for (const page of ['nao-e-uma-pagina', Buffer.from('not-an-id').toString('base64url')]) {
    const malformed = await call(w.hub, w.ana, 'GET', url(w, `?page=${page}`))
    assert.equal(malformed.statusCode, 400, page)
    assert.equal(Object(malformed.json()).code, 'REQUEST_MALFORMED')
  }
})
