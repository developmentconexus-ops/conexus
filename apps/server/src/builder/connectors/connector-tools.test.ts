import assert from 'node:assert/strict'
import { test } from 'node:test'
import { ConnectionId, PersonId, RunId } from '@conexus/hub-api'
import { RequestContext } from '@mastra/core/request-context'
import type { BuilderConnectors, GrantedConnection } from './public.ts'
import { builderAccess, connectorTools } from './public.ts'

const SANKHYA = ConnectionId.parse('11111111-1111-4111-8111-111111111111')
const LOJA = ConnectionId.parse('22222222-2222-4222-8222-222222222222')
const RUN = RunId.parse('33333333-3333-4333-8333-333333333333')

function granted(connector: string, connectionId: ConnectionId): GrantedConnection {
  return {
    connectionId,
    connector,
    name: 'Matriz',
    perProject: 'many',
    skill: { name: `conexus-${connector}`, content: '', references: {} },
    reads: [{ operation: 'consultar', summary: 'consulta' }],
    notes: [],
  }
}

function tools() {
  const seen: { notes: string[]; saved: string[] } = { notes: [], saved: [] }
  const port: BuilderConnectors = {
    granted: async () => [],
    read: async () => ({ kind: 'NOT_GRANTED' }),
    notes: async (_ids, connectionId) => {
      seen.notes.push(connectionId)
      return {}
    },
    saveNote: async (_ids, a) => {
      seen.saved.push(a.connectionId)
      return { kind: 'SAVED', provedRows: 1 }
    },
  }
  const ids = {
    companyId: '44444444444444444444444444444444',
    projectId: '55555555555555555555555555555555',
  }
  const { access, save } = builderAccess(
    port,
    [granted('mercado-livre', LOJA), granted('sankhya', SANKHYA)],
    {
      ...Object(ids),
      personId: PersonId.parse('66666666-6666-4666-8666-666666666666'),
      runIdOf: () => RUN,
    },
  )
  const set = connectorTools(access, { noteSave: true, save })
  function run(name: string, input: object) {
    const found = Object(set)[name]
    return found.execute(input, { requestContext: new RequestContext() })
  }
  return { run, seen }
}

test('duas ligações de mesmo nome em conectores diferentes: o caderno e a anotação vão à do conector dito', async () => {
  const { run, seen } = tools()
  assert.deepEqual(await run('connector_notes', { connection: 'Matriz', connector: 'sankhya' }), {})
  assert.deepEqual(seen.notes, [SANKHYA])
  const note = { connection: 'Matriz', concept: 'C', mapping: 'm', provingQuery: 'q' }
  assert.equal((await run('connector_note_save', { ...note, connector: 'sankhya' })).kind, 'SAVED')
  assert.deepEqual(seen.saved, [SANKHYA])
})

test('sem o conector, o nome que duas ligações têm é ambíguo e nada é chamado', async () => {
  const { run, seen } = tools()
  const note = { connection: 'Matriz', concept: 'C', mapping: 'm', provingQuery: 'q' }
  assert.equal(
    (await run('connector_notes', { connection: 'Matriz' })).kind,
    'AMBIGUOUS_CONNECTION',
  )
  assert.equal((await run('connector_note_save', note)).kind, 'AMBIGUOUS_CONNECTION')
  assert.deepEqual([seen.notes, seen.saved], [[], []])
})

test('um nome que nenhuma ligação liberada tem responde NOT_GRANTED', async () => {
  const { run, seen } = tools()
  const note = { connection: 'Filial', concept: 'C', mapping: 'm', provingQuery: 'q' }
  assert.equal((await run('connector_notes', { connection: 'Filial' })).kind, 'NOT_GRANTED')
  assert.equal((await run('connector_note_save', note)).kind, 'NOT_GRANTED')
  assert.deepEqual([seen.notes, seen.saved], [[], []])
})
