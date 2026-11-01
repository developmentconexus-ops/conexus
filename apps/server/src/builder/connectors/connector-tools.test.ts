import assert from 'node:assert/strict'
import { test } from 'node:test'
import { ConnectionId, PersonId, RunId } from '@conexus/hub-api'
import { RequestContext } from '@mastra/core/request-context'
import type { Scalar } from '../../platform/failure.ts'
import type { BuilderConnectors, ConnectorAccess, GrantedConnection } from './public.ts'
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

test('um nome que nenhuma ligação liberada tem é recusado pelo esquema da ferramenta, que diz os nomes, e nada é chamado', async () => {
  const { run, seen } = tools()
  const note = { connection: 'Filial', concept: 'C', mapping: 'm', provingQuery: 'q' }
  for (const refused of [
    await run('connector_notes', { connection: 'Filial' }),
    await run('connector_note_save', note),
  ]) {
    assert.equal(refused.error, true)
    assert.match(refused.message, /connection: Invalid input: expected "Matriz"/)
  }
  assert.deepEqual([seen.notes, seen.saved], [[], []])
})

function savingTo(files: { writeFile(path: string, content: string): Promise<void> }) {
  const logged: { fields: Record<string, Scalar>; message: string }[] = []
  const signals: (AbortSignal | undefined)[] = []
  const access: ConnectorAccess = {
    connections: [granted('sankhya', SANKHYA)],
    read: async (call) => {
      signals.push(call.signal)
      return { kind: 'OK', value: { linhas: [] }, complete: true, whole: { linhas: [] } }
    },
    savedAt: () => 'reads/aaaa-1.json',
    log: {
      info: (fields, message) => logged.push({ fields, message }),
      error: (fields, message) => logged.push({ fields, message }),
    },
    notes: async () => null,
    wording: { whose: 'x', limit: 'y' },
  }
  const set = connectorTools(access, { noteSave: false })
  const stop = new AbortController()
  function run() {
    return Object(set).connector_read.execute(
      { connection: 'Matriz', operation: 'sankhya.consultar', input: {} },
      {
        requestContext: new RequestContext(),
        workspace: { filesystem: files },
        abortSignal: stop.signal,
      },
    )
  }
  return { run, logged, signals, stop }
}

test('uma escrita em reads/ que falha depois da máquina ligada responde saved:false e vai ao registro, em vez de estourar', async () => {
  const failing = savingTo({
    writeFile: async () => {
      throw new Error('disk quota SECRET-PLANTED-TEXT')
    },
  })
  const answered = await failing.run()
  assert.equal(answered.saved, false)
  assert.equal(answered.reason, 'MACHINE_UNAVAILABLE')
  assert.ok(!('file' in answered))
  assert.equal(failing.logged.length, 1)
  assert.equal(failing.logged[0]?.message, 'MACHINE_UNAVAILABLE')
  assert.equal(failing.logged[0]?.fields.reason, 'READS_WRITE')
  assert.ok(!JSON.stringify(failing.logged).includes('SECRET-PLANTED-TEXT'), 'no raw error text')
  const saving = savingTo({ writeFile: async () => undefined })
  assert.equal((await saving.run()).file, 'reads/aaaa-1.json')
  assert.deepEqual(saving.logged, [])
})

test('a leitura leva o sinal do turno da ferramenta: Parar chega à porta', async () => {
  const on = savingTo({ writeFile: async () => undefined })
  await on.run()
  assert.equal(on.signals[0], on.stop.signal)
})
