import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import { CompanyId, ConnectionId, PersonId, ProjectId, RunId } from '@conexus/hub-api'
import { call } from '../identity/test-hub.ts'
import { appCalls, CONNECTOR_CALLS_PER_TURN } from './test-app-calls.ts'

const QUERY = 'SELECT COUNT(*) AS N FROM TSIEMP'

async function builderOn(t: Parameters<typeof appCalls>[0]) {
  const on = await appCalls(t)
  const connectionId = ConnectionId.parse(await on.connect('Matriz'))
  const ids = { companyId: CompanyId.parse(on.companyId), projectId: ProjectId.parse(on.projectId) }
  function who(run = randomUUID()) {
    return { connectionId, personId: PersonId.parse(on.ana.id), runId: RunId.parse(run) }
  }
  return { ...on, connectionId, ids, who, port: on.hub.connectors.builder }
}

test('guardar: roda a consulta uma vez pela porta e guarda o mapa, a consulta, a data, as linhas e quem, nunca uma linha', async (t) => {
  const on = await builderOn(t)
  const saved = await on.port.saveNote(on.ids, {
    ...on.who(),
    concept: 'Empresa',
    mapping: 'TSIEMP.CODEMP é o código da empresa',
    provingQuery: QUERY,
  })
  assert.equal(saved.kind, 'SAVED')
  const [row] = await on.hub.test.asOwner('select notes from connectors.connection')
  const note = Object(Object(row).notes).Empresa
  assert.deepEqual(Object.keys(note).sort(), [
    'mapping',
    'provedAt',
    'provedRows',
    'provingQuery',
    'writtenBy',
  ])
  assert.equal(note.writtenBy, on.ana.id)
  const answered = Object((await on.read({ operation: 'consultar', input: { sql: QUERY } })).json())
  for (const value of Object.values(Object(answered.value?.linhas?.[0] ?? {})))
    assert.ok(!JSON.stringify(note).includes(String(value)) || String(value).length < 3)
  assert.deepEqual(await on.port.notes(on.ids, on.connectionId), Object(row).notes)
})

test('guardar: a consulta que a porta recusa recusa a anotação; o caderno cheio é NOTE_INVALID; a 51ª chamada da execução é recusada', async (t) => {
  const on = await builderOn(t)
  const refused = await on.port.saveNote(on.ids, {
    ...on.who(),
    concept: 'X',
    mapping: 'm',
    provingQuery: 'DELETE FROM TSIEMP',
  })
  assert.notEqual(refused.kind, 'SAVED')
  assert.deepEqual(
    await on.hub.test.asOwner("select 1 from connectors.connection where notes <> '{}'"),
    [],
  )
  await on.hub.test.asOwner(
    "update connectors.connection set notes = jsonb_build_object('grande', repeat('a', 32700))",
  )
  const full = await on.port.saveNote(on.ids, {
    ...on.who(),
    concept: 'Y',
    mapping: 'm',
    provingQuery: QUERY,
  })
  assert.deepEqual(full, { kind: 'NOTE_INVALID' })
  const same = on.who()
  const results = []
  for (let n = 0; n < CONNECTOR_CALLS_PER_TURN + 1; n += 1)
    results.push(
      (await on.port.read(on.ids, { ...same, operation: 'empresas', input: { page: 0 } })).kind,
    )
  assert.equal(results.filter((kind) => kind === 'OK').length, CONNECTOR_CALLS_PER_TURN)
  assert.equal(results.at(-1), 'CALLS_SPENT')
})

test('apagar: a dona tira só aquela anotação; o membro 404; a página da ligação mostra as anotações ao membro', async (t) => {
  const on = await builderOn(t)
  for (const concept of ['Empresa', 'Vendedor'])
    await on.port.saveNote(on.ids, {
      ...on.who(),
      concept,
      mapping: `mapa ${concept}`,
      provingQuery: QUERY,
    })
  const route = `/api/companies/${on.companyId}/connections/${on.connectionId}`
  assert.equal((await call(on.hub, on.carla, 'DELETE', `${route}/notes/Empresa`)).statusCode, 404)
  assert.equal((await call(on.hub, on.ana, 'DELETE', `${route}/notes/Empresa`)).statusCode, 204)
  assert.equal((await call(on.hub, on.ana, 'DELETE', `${route}/notes/Empresa`)).statusCode, 204)
  const page = await call(on.hub, on.carla, 'GET', route)
  assert.deepEqual(
    Object(page.json()).notes.map((n: { concept: string }) => n.concept),
    ['Vendedor'],
  )
  assert.equal(Object(page.json()).notes[0].writtenBy, 'Ana Lima')
})
