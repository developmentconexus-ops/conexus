import assert from 'node:assert/strict'
import { test } from 'node:test'
import { PersonId, RunId } from '@conexus/hub-api'
import { RequestContext } from '@mastra/core/request-context'
import { granted, QUIET, runOn, SANKHYA, YES } from '../../harness/tools/connectors/test-access.ts'
import type { ConnectorPort } from '../../harness/tools/public.ts'
import { connectorTools } from '../../harness/tools/public.ts'
import { builderAccess } from './public.ts'

const RUN = RunId.parse('33333333-3333-4333-8333-333333333333')

test('a leitura do Builder chega à porta com a ligação, a operação e a consulta, e a escrita do caderno leva a corrida', async () => {
  const seen: unknown[] = []
  const port: ConnectorPort = {
    granted: async () => [],
    read: async (_ids, call) => {
      seen.push(call)
      return { kind: 'NOT_GRANTED' }
    },
    notes: async () => ({}),
    saveNote: async (_ids, call) => {
      seen.push(call)
      return { kind: 'SAVED', provedRows: 1 }
    },
  }
  const ids = {
    companyId: '44444444444444444444444444444444',
    projectId: '55555555555555555555555555555555',
  }
  const person = PersonId.parse('66666666-6666-4666-8666-666666666666')
  const { access, save } = builderAccess(
    port,
    [granted('sankhya', SANKHYA)],
    { ...Object(ids), personId: person, runIdOf: () => RUN },
    QUIET,
  )
  const set = connectorTools(access, { noteSave: true, save })
  await runOn(set, 'connector_read', {
    connection: 'Matriz',
    operation: 'sankhya.consultar',
    input: { sql: 'SELECT 1' },
  })
  const note = { connection: 'Matriz', concept: 'C', mapping: 'm', provingQuery: 'q' }
  await runOn(set, 'connector_note_save', note, YES)
  assert.deepEqual(seen[0], {
    connectionId: SANKHYA,
    operation: 'consultar',
    input: { sql: 'SELECT 1' },
    personId: person,
    runId: RUN,
    signal: undefined,
  })
  assert.deepEqual(seen[1], {
    connectionId: SANKHYA,
    concept: 'C',
    mapping: 'm',
    provingQuery: 'q',
    personId: person,
    runId: RUN,
  })
})

test('uma leitura fora de uma corrida do Builder lança CONNECTOR_TOOL_WITHOUT_RUN e nada chega à porta; o sim do cartão do caderno, que retoma antes de a corrida tomar o Projeto, grava como uma corrida só dele', async () => {
  const calls: unknown[] = []
  const port: ConnectorPort = {
    granted: async () => [],
    read: async (...args) => {
      calls.push(args)
      return { kind: 'NOT_GRANTED' }
    },
    notes: async () => ({}),
    saveNote: async (...args) => {
      calls.push(args)
      return { kind: 'SAVED', provedRows: 1 }
    },
  }
  const { access, save } = builderAccess(
    port,
    [granted('sankhya', SANKHYA)],
    {
      ...Object(ids()),
      personId: PersonId.parse('66666666-6666-4666-8666-666666666666'),
      runIdOf: () => undefined,
    },
    QUIET,
  )
  const set = connectorTools(access, { noteSave: true, save })
  const read = { connection: 'Matriz', operation: 'sankhya.consultar', input: {} }
  function refusal(error: unknown) {
    return Object(error).details?.reason === 'CONNECTOR_TOOL_WITHOUT_RUN'
  }
  await assert.rejects(runOn(set, 'connector_read', read), refusal)
  assert.deepEqual(calls, [])
  const [matriz] = access.connections
  assert.ok(matriz)
  await save(
    { connectionId: matriz.connectionId, concept: 'C', mapping: 'm', provingQuery: 'q' },
    new RequestContext(),
  )
  assert.equal(calls.length, 1)
})

function ids() {
  return {
    companyId: '44444444444444444444444444444444',
    projectId: '55555555555555555555555555555555',
  }
}
