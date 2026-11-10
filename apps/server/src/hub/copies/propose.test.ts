import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import { PersonId, RunId } from '@conexus/hub-api'
import { CONNECTOR_CALLS_PER_TURN } from '../connectors/test-app-calls.ts'
import { memberOn, post } from '../identity/test-hub.ts'
import { ATENDENTE } from '../identity/test-roles.ts'
import { copiesOn } from './test-copies.ts'
import { definitionOf, grantMatriz, proposalRows, proposeAs } from './test-proposals.ts'

test('propor: prova uma página e guarda só a contagem', async (t) => {
  const on = await copiesOn(t)
  await grantMatriz(on)
  const definition = definitionOf(on)
  const answer = await proposeAs(on, { definition })
  assert.equal(answer.kind, 'PROPOSED', JSON.stringify(answer))
  if (answer.kind !== 'PROPOSED') return
  const [row, ...more] = await proposalRows(on)
  assert.equal(more.length, 0)
  assert.equal(row.state, 'OPEN')
  assert.equal(row.name, 'devolucoes')
  assert.equal(row.project_id, on.projectId)
  // The page of proof is 50 rows at most; the double's sales fill it and more follow.
  assert.deepEqual(
    { rows: answer.rows, more: answer.more },
    { rows: row.proved_rows, more: row.proved_more },
  )
  assert.ok(answer.rows > 0 && answer.rows <= 50)
  // Only the counts leave: the answer's keys, and the row keeps the definition, never a row of the source.
  assert.deepEqual(Object.keys(answer).sort(), [
    'connection',
    'key',
    'kind',
    'mode',
    'more',
    'name',
    'proposalId',
    'rows',
  ])
  assert.deepEqual(row.definition, definition)
  assert.deepEqual(answer.mode, { kind: 'WINDOW', days: definition.window?.days ?? 0 })
  assert.deepEqual(answer.key, definition.key)
  assert.equal(answer.connection.connector, 'sankhya')
})

test('propor: a prova conta na conta de 50 da rodada', async (t) => {
  const on = await copiesOn(t)
  await grantMatriz(on)
  const runId = RunId.parse(randomUUID())
  const ids = { companyId: on.companyId, projectId: on.projectId }
  for (let call = 0; call < CONNECTOR_CALLS_PER_TURN; call += 1) {
    // A read the kit's schema refuses before the provider: it still spends one of the run's calls.
    const read = await on.hub.connectors.builder.read(ids, {
      connectionId: on.connectionId,
      personId: PersonId.parse(on.ana.id),
      runId,
      operation: 'consultar',
      input: {},
    })
    assert.equal(read.kind, 'REFUSED')
  }
  assert.deepEqual(await proposeAs(on, { runId }), { kind: 'CALLS_SPENT' })
  assert.deepEqual(await proposalRows(on), [])
})

test('propor: as recusas', async (t) => {
  const on = await copiesOn(t)
  const anaId = PersonId.parse(on.ana.id)
  // Not released to the Projeto.
  assert.deepEqual(await proposeAs(on), { kind: 'NOT_GRANTED' })
  await grantMatriz(on)
  const broken = { ...definitionOf(on), key: ['NUNCA'] }
  const malformed = await proposeAs(on, { definition: broken })
  assert.equal(malformed.kind, 'MALFORMED')
  assert.match(JSON.stringify(malformed), /definition\.key\.0: A key column is a bigint column/)
  const badName = await proposeAs(on, { name: 'Devoluções' })
  assert.equal(badName.kind, 'MALFORMED')
  assert.match(JSON.stringify(badName), /^\{"kind":"MALFORMED","issues":\["name: /)
  // A copy of the company, then the same copy released to this Projeto.
  const copyId = await on.enable('vendas')
  assert.deepEqual(await proposeAs(on, { name: 'vendas' }), {
    kind: 'EXISTS',
    name: 'vendas',
    releasedHere: false,
  })
  await on.copies.grant({
    companyId: on.companyId,
    personId: anaId,
    projectId: on.projectId,
    copyId,
  })
  assert.deepEqual(await proposeAs(on, { name: 'vendas' }), {
    kind: 'EXISTS',
    name: 'vendas',
    releasedHere: true,
  })
  // A role of the company's own that holds no read of the connection's door.
  const created = await post(on.hub, on.ana, `/api/companies/${on.companyId}/roles`, ATENDENTE)
  assert.equal(created.statusCode, 201, created.body)
  const who = { name: 'Enzo Alves', email: 'enzo@example.test' }
  const enzo = await memberOn(on.hub, on.companyId, who, 'atendente')
  const own = await proposeAs(on, { personId: PersonId.parse(enzo.id) })
  assert.deepEqual(own, { kind: 'NOT_IN_ROLE', role: 'atendente', operation: 'consultar' })
  // The system's refusal, whole, as `connector_read` gets it (C79).
  on.fake.switches.refuse.add('consultar')
  const refused = await proposeAs(on)
  on.fake.switches.refuse.delete('consultar')
  assert.equal(refused.kind, 'REFUSED')
  assert.ok('native' in refused && refused.native.message !== null, JSON.stringify(refused))
  assert.deepEqual(await proposalRows(on), [])
  // An open proposal of the name.
  assert.equal((await proposeAs(on)).kind, 'PROPOSED')
  assert.deepEqual(await proposeAs(on), { kind: 'EXISTS', name: 'devolucoes', releasedHere: false })
  assert.equal((await proposalRows(on)).length, 1)
})

test('propor: as formas de definição', async (t) => {
  const on = await copiesOn(t)
  await grantMatriz(on)
  const base = definitionOf(on)
  const { window: _window, ...noWindow } = base
  const shapes = {
    inteira: { ...noWindow, changedSince: null },
    alterado: noWindow,
    janela: base,
  }
  const modes: Record<string, unknown> = {}
  for (const [name, definition] of Object.entries(shapes)) {
    const answer = await proposeAs(on, { name, definition })
    assert.equal(answer.kind, 'PROPOSED', JSON.stringify(answer))
    modes[name] = Object(answer).mode
  }
  assert.deepEqual(modes, {
    inteira: { kind: 'WHOLE' },
    alterado: { kind: 'CHANGES' },
    janela: { kind: 'WINDOW', days: base.window?.days },
  })
  const kept = await proposalRows(on)
  assert.deepEqual(
    Object.fromEntries(kept.map((row) => [row.name, row.definition])),
    Object(shapes),
  )
})

test('a proposta sai com o Projeto e com a conexão', async (t) => {
  const on = await copiesOn(t)
  await grantMatriz(on)
  assert.equal((await proposeAs(on)).kind, 'PROPOSED')
  await on.hub.test.asOwner('delete from projects.project where id = $1', [on.projectId])
  assert.deepEqual(await proposalRows(on), [])
  const other = await copiesOn(t)
  await grantMatriz(other)
  assert.equal((await proposeAs(other)).kind, 'PROPOSED')
  await other.hub.test.asOwner('delete from connectors.connection where id = $1', [
    other.connectionId,
  ])
  assert.deepEqual(await proposalRows(other), [])
})

test('o registro não leva dado', async (t) => {
  const on = await copiesOn(t)
  await grantMatriz(on)
  const definition = definitionOf(on)
  const answer = await proposeAs(on, { definition })
  assert.equal(answer.kind, 'PROPOSED')
  const line = on.hub.lines.find((each) => each.message === 'COPY_PROPOSED')
  assert.ok(line)
  assert.deepEqual(Object.keys(line.fields).sort(), [
    'companyId',
    'connectionId',
    'more',
    'projectId',
    'proposalId',
    'rows',
  ])
  const written = JSON.stringify(on.hub.lines)
  assert.ok(!written.includes(definition.source.sql), 'the query is never logged')
})
