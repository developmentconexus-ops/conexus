import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import { CompanyId, ConnectionId, PersonId, ProjectId } from '@conexus/hub-api'
import { memberOn } from '../identity/test-hub.ts'
import { TurnKey } from './public.ts'
import { appCalls, CONNECTOR_CALLS_PER_TURN } from './test-app-calls.ts'

const QUERY = 'SELECT COUNT(*) AS N FROM TSIEMP'
const DIEGO = { name: 'Diego Reis', email: 'diego@example.test' }

/** Empresa A with Matriz, not released to its Projeto; the Assistant's door asked by a person. */
async function notingOn(t: Parameters<typeof appCalls>[0]) {
  const on = await appCalls(t)
  const matriz = ConnectionId.parse(await on.connect('Matriz', false))
  const port = on.hub.connectors.assistant
  function scope(
    who: { id: string },
    a: { project?: boolean; chosen?: readonly ConnectionId[]; turn?: string } = {},
  ) {
    const place = a.project
      ? ({ kind: 'PROJECT', projectId: ProjectId.parse(on.projectId) } as const)
      : ({ kind: 'COMPANY' } as const)
    const companyId = CompanyId.parse(on.companyId)
    return { companyId, personId: PersonId.parse(who.id), place, chosen: a.chosen ?? [matriz] }
  }
  function note(who: { id: string }, a: Parameters<typeof scope>[1] & { sql?: string } = {}) {
    return port.saveNote(scope(who, a), {
      connectionId: matriz,
      turn: TurnKey.parse(a.turn ?? randomUUID()),
      concept: 'Empresa',
      mapping: 'TSIEMP.CODEMP é o código da empresa',
      provingQuery: a.sql ?? QUERY,
    })
  }
  function read(who: { id: string }, turn: string) {
    const call = { connectionId: matriz, turn: TurnKey.parse(turn) }
    return port.read(scope(who), { ...call, operation: 'empresas', input: { page: 0 } })
  }
  async function notebook() {
    const query = 'select notes from connectors.connection where id = $1'
    const [row] = await on.hub.test.asOwner(query, [matriz])
    return Object(row).notes
  }
  return { ...on, note, read, notebook }
}

test('a anotação recusada: o membro e o desenvolvedor, de verdade no banco, a ligação não escolhida e a que o lugar não oferece dão NOT_GRANTED, o motivo só no registro, e o caderno não muda', async (t) => {
  const on = await notingOn(t)
  const diego = await memberOn(on.hub, on.companyId, DIEGO, 'developer')
  for (const who of [on.carla, diego]) assert.deepEqual(await on.note(who), { kind: 'NOT_GRANTED' })
  const refusals = on.hub.lines.filter((line) => line.message === 'CONNECTION_NOTE_REFUSED')
  assert.deepEqual(
    refusals.map((line) => [line.fields.personId, line.fields.reason]),
    [
      [on.carla.id, 'FORBIDDEN'],
      [diego.id, 'FORBIDDEN'],
    ],
  )
  assert.deepEqual(await on.note(on.ana, { chosen: [] }), { kind: 'NOT_GRANTED' })
  assert.deepEqual(await on.note(on.ana, { project: true }), { kind: 'NOT_GRANTED' })
  const reasons = on.hub.lines
    .filter((line) => line.message === 'ASSISTANT_READ_REFUSED')
    .map((line) => line.fields.reason)
  assert.deepEqual(reasons, ['NOT_CHOSEN', 'NOT_OFFERED'])
  assert.deepEqual(await on.notebook(), {})
  assert.deepEqual(await on.note(on.bruno), { kind: 'SAVED', provedRows: 1 })
  assert.equal((await on.notebook()).Empresa.writtenBy, on.bruno.id)
})

test('a prova da anotação: a consulta que a porta recusa não grava; a gravação conta uma das 50 chamadas do turno; o caderno cheio é NOTE_INVALID', async (t) => {
  const on = await notingOn(t)
  assert.notEqual((await on.note(on.ana, { sql: 'DELETE FROM TSIEMP' })).kind, 'SAVED')
  assert.deepEqual(await on.notebook(), {})
  const turn = randomUUID()
  assert.equal((await on.note(on.ana, { turn })).kind, 'SAVED')
  for (let n = 1; n < CONNECTOR_CALLS_PER_TURN; n += 1)
    assert.equal((await on.read(on.ana, turn)).kind, 'OK')
  assert.equal((await on.read(on.ana, turn)).kind, 'CALLS_SPENT')
  assert.deepEqual(await on.note(on.ana, { turn }), { kind: 'CALLS_SPENT' })
  await on.hub.test.asOwner(
    "update connectors.connection set notes = jsonb_build_object('grande', repeat('a', 32700))",
  )
  assert.deepEqual(await on.note(on.ana), { kind: 'NOTE_INVALID' })
})
