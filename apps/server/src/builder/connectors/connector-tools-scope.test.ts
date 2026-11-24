import assert from 'node:assert/strict'
import { test } from 'node:test'
import { PersonId, RunId } from '@conexus/hub-api'
import { RequestContext } from '@mastra/core/request-context'
import type { BuilderConnectors } from './public.ts'
import { builderAccess, connectorTools } from './public.ts'
import { accessOver, granted, LOJA, QUIET, runOn, SANKHYA, YES } from './test-access.ts'

const RUN = RunId.parse('33333333-3333-4333-8333-333333333333')

test('a leitura do Builder chega à porta com a ligação, a operação e a consulta, e a escrita do caderno leva a corrida', async () => {
  const seen: unknown[] = []
  const port: BuilderConnectors = {
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
  const port: BuilderConnectors = {
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

test('duas ligações de mesmo nome em sistemas diferentes: a leitura vai à do sistema da operação', async () => {
  const { access, reads } = accessOver([
    granted('sankhya', SANKHYA),
    granted('mercado-livre', LOJA),
  ])
  const set = connectorTools(access, { noteSave: false })
  await runOn(set, 'connector_read', {
    connection: 'Matriz',
    operation: 'mercado-livre.consultar',
    input: {},
  })
  await runOn(set, 'connector_read', {
    connection: 'Matriz',
    operation: 'sankhya.consultar',
    input: {},
  })
  assert.deepEqual(
    reads.map((read) => read.connectionId),
    [LOJA, SANKHYA],
  )
})

test('o caderno: só dois sistemas com o mesmo nome dão AMBIGUOUS_CONNECTION; um nome só, ou nomes diferentes, vão direto à ligação', async () => {
  const single = accessOver([
    granted('sankhya', SANKHYA, 'Matriz'),
    granted('sankhya', LOJA, 'Filial'),
  ])
  const set = connectorTools(single.access, { noteSave: false })
  assert.deepEqual(await runOn(set, 'connector_notes', { connection: 'Matriz' }), {})
  assert.deepEqual(single.notes, [SANKHYA])
  const named = await runOn(set, 'connector_notes', { connection: 'Matriz', connector: 'outro' })
  assert.deepEqual(named, { kind: 'NOT_GRANTED' })
  const alone = accessOver([granted('sankhya', SANKHYA)])
  assert.deepEqual(
    await runOn(connectorTools(alone.access, { noteSave: false }), 'connector_notes', {
      connection: 'Matriz',
    }),
    {},
  )
})

test('a escrita do caderno de um conector que a ligação não tem é NOT_GRANTED, e nada é salvo', async () => {
  const saved: unknown[] = []
  const { access } = accessOver([granted('sankhya', SANKHYA)])
  const set = connectorTools(access, {
    noteSave: true,
    save: async (call) => {
      saved.push(call)
      return { kind: 'SAVED', provedRows: 1 }
    },
  })
  const note = { connection: 'Matriz', concept: 'C', mapping: 'm', provingQuery: 'q' }
  assert.deepEqual(await runOn(set, 'connector_note_save', { ...note, connector: 'outro' }, YES), {
    kind: 'NOT_GRANTED',
  })
  assert.deepEqual(saved, [])
})

test('a escrita do caderno recusa o vazio e o que passa dos limites do conceito, do mapeamento e da consulta', async () => {
  const saved: unknown[] = []
  const { access } = accessOver([granted('sankhya', SANKHYA)])
  const set = connectorTools(access, {
    noteSave: true,
    save: async (call) => {
      saved.push(call)
      return { kind: 'SAVED', provedRows: 1 }
    },
  })
  const full = { connection: 'Matriz', concept: 'C', mapping: 'm', provingQuery: 'q' }
  const limits = { concept: 120, mapping: 500, provingQuery: 4000 }
  for (const [field, max] of Object.entries(limits)) {
    const refused = [
      await runOn(set, 'connector_note_save', { ...full, [field]: '' }),
      await runOn(set, 'connector_note_save', { ...full, [field]: 'x'.repeat(max + 1) }),
    ]
    for (const each of refused) assert.equal(each.error, true, field)
    const kept = await runOn(set, 'connector_note_save', { ...full, [field]: 'x'.repeat(max) }, YES)
    assert.equal(kept.kind, 'SAVED', field)
  }
  assert.equal(saved.length, 3)
})

test('a leitura com a máquina: o arquivo inteiro é gravado criando a pasta reads/, uma recusa passa intacta, e sem máquina ou sem caminho volta o corte', async () => {
  const written: string[] = []
  const files = {
    writeFile: async (path: string, _content: string, options?: { recursive?: boolean }) => {
      if (path.includes('/') && options?.recursive !== true)
        throw new Error('ENOENT: no such folder')
      written.push(path)
    },
  }
  const whole = {
    kind: 'OK',
    value: { linhas: [] },
    complete: true,
    rows: 0,
    bytes: 14,
    whole: { linhas: [1] },
  } as const
  const read = { connection: 'Matriz', operation: 'sankhya.consultar', input: {} }
  const withMachine = accessOver([granted('sankhya', SANKHYA)], {
    read: async () => whole,
    savedAt: () => 'reads/aaaa-1.json',
  })
  const set = connectorTools(withMachine.access, { noteSave: false })
  const saved = await runOn(set, 'connector_read', read, { workspace: { filesystem: files } })
  assert.deepEqual(written, ['reads/aaaa-1.json'])
  assert.equal(saved.file, 'reads/aaaa-1.json')
  assert.equal('whole' in saved, false)

  const spent = accessOver([granted('sankhya', SANKHYA)], {
    read: async () => ({ kind: 'CALLS_SPENT' }),
    savedAt: () => 'reads/aaaa-2.json',
  })
  const refused = await runOn(
    connectorTools(spent.access, { noteSave: false }),
    'connector_read',
    read,
    {
      workspace: { filesystem: files },
    },
  )
  assert.deepEqual(refused, { kind: 'CALLS_SPENT' })
  assert.equal(written.length, 1, 'a refusal is not written')

  const noMachine = await runOn(set, 'connector_read', read)
  assert.deepEqual(
    [noMachine.kind, 'file' in noMachine, 'saved' in noMachine],
    ['OK', false, false],
  )
  const noPath = accessOver([granted('sankhya', SANKHYA)], { read: async () => whole })
  const cut = await runOn(
    connectorTools(noPath.access, { noteSave: false }),
    'connector_read',
    read,
    {
      workspace: { filesystem: files },
    },
  )
  assert.deepEqual(
    [cut.kind, 'file' in cut, 'saved' in cut, 'whole' in cut],
    ['OK', false, false, false],
  )
  assert.equal(written.length, 1)
})

test('uma ligação sem leituras não leva a ferramenta de leitura, mas leva o caderno; sem ligações nenhuma ferramenta', () => {
  const none = { ...accessOver([]).access }
  assert.deepEqual(Object.keys(connectorTools(none, { noteSave: false })), [])
  const noReads = accessOver([{ ...granted('sankhya', SANKHYA), reads: [] }]).access
  assert.deepEqual(Object.keys(connectorTools(noReads, { noteSave: false })), ['connector_notes'])
})

test('o caderno pede o sim: a primeira chamada suspende com o pedido e nada chega à porta; o não devolve NOT_SAVED e nada chega à porta', async () => {
  const saved: unknown[] = []
  const { access } = accessOver([granted('sankhya', SANKHYA)])
  const set = connectorTools(access, {
    noteSave: true,
    save: async (call) => {
      saved.push(call)
      return { kind: 'SAVED', provedRows: 1 }
    },
  })
  const note = { connection: 'Matriz', concept: 'C', mapping: 'm', provingQuery: 'q' }
  const suspended: unknown[] = []
  const asking = { agent: { suspend: async (payload: unknown) => void suspended.push(payload) } }
  assert.equal(await runOn(set, 'connector_note_save', note, asking), undefined)
  assert.deepEqual(suspended, [note])
  const no = { agent: { resumeData: { approved: false } } }
  assert.deepEqual(await runOn(set, 'connector_note_save', note, no), { kind: 'NOT_SAVED' })
  assert.deepEqual(saved, [])
})
