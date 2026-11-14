import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { ConceptProposed } from '@conexus/hub-api'
import { ConnectionId, OntologyProposalId, PersonId, RunId } from '@conexus/hub-api'
import { RequestContext } from '@mastra/core/request-context'
import type { OntologyDoor } from '../ontology/public.ts'
import type { BuilderConnectors, ConnectorAccess, GrantedConnection } from './public.ts'
import { builderAccess, connectorTools } from './public.ts'

const SANKHYA = ConnectionId.parse('11111111-1111-4111-8111-111111111111')
const LOJA = ConnectionId.parse('22222222-2222-4222-8222-222222222222')
const RUN = RunId.parse('33333333-3333-4333-8333-333333333333')

function granted(
  connector: string,
  connectionId: ConnectionId,
  name = 'Matriz',
): GrantedConnection {
  return {
    connectionId,
    connector,
    name,
    perProject: 'many',
    skill: { name: `conexus-${connector}`, content: '', references: {} },
    reads: [{ operation: 'consultar', label: 'Consultas', summary: 'consulta', list: null }],
    writes: [],
    copies: false,
  }
}

const QUIET = { info: () => undefined, error: () => undefined }

/** An access over `connections`, whose reads are recorded. */
function accessOver(
  connections: ReturnType<typeof granted>[],
  over: Partial<ConnectorAccess> = {},
) {
  const reads: { connectionId: string; operation: string; input: unknown }[] = []
  const access: ConnectorAccess = {
    connections,
    read: async (call) => {
      reads.push({ connectionId: call.connectionId, operation: call.operation, input: call.input })
      return { kind: 'OK', value: { linhas: [] }, complete: true, rows: 0, bytes: 14 }
    },
    log: QUIET,
    wording: { whose: 'x', limit: 'y' },
    ...over,
  }
  return { access, reads }
}

const RENAME = {
  connection: 'Matriz',
  demand: 'o nome do pedido',
  items: [{ kind: 'RENAME_LABEL', target: 'pedido', name: 'Pedido' }],
}

const PROPOSED: ConceptProposed = {
  kind: 'PROPOSED',
  proposalId: OntologyProposalId.parse('77777777-7777-4777-8777-777777777777'),
  baseRevision: 0,
  items: [],
  refused: [],
}

/** The Ontology's door for these tests: a proposal is recorded and answers an empty one. */
function ontologyOf(seen: unknown[]): OntologyDoor {
  return {
    search: async () => ({ kind: 'EMPTY' }),
    propose: async (input) => {
      seen.push({ connectionId: input.door.connectionId, items: input.items })
      return PROPOSED
    },
  }
}

function conceptDoor(connectionId: ConnectionId) {
  return {
    connectionId,
    prove: async () => ({ kind: 'CALLS_SPENT' }) as const,
    query: async () => ({ kind: 'CALLS_SPENT' }) as const,
  }
}

function runOn(set: object, name: string, input: object, context: object = {}) {
  return Object(set)[name].execute(input, { requestContext: new RequestContext(), ...context })
}

test('a leitura do Builder chega à porta com a ligação, a operação e a consulta, e a proposta de conceitos leva a corrida', async () => {
  const seen: unknown[] = []
  const port: BuilderConnectors = {
    granted: async () => [],
    provePage: async () => ({ kind: 'NOT_GRANTED' }),
    propose: async () => ({ kind: 'NOT_GRANTED' }),
    read: async (_ids, call) => {
      seen.push(call)
      return { kind: 'NOT_GRANTED' }
    },
    concepts: async (_ids, call) => {
      seen.push(call)
      return conceptDoor(call.connectionId)
    },
  }
  const ids = {
    companyId: '44444444444444444444444444444444',
    projectId: '55555555555555555555555555555555',
  }
  const person = PersonId.parse('66666666-6666-4666-8666-666666666666')
  const proposed: unknown[] = []
  const { access, concepts } = builderAccess(
    port,
    ontologyOf(proposed),
    [granted('sankhya', SANKHYA)],
    { ...Object(ids), personId: person, runIdOf: () => RUN },
    QUIET,
  )
  const set = connectorTools(access, { concepts })
  await runOn(set, 'connector_read', {
    connection: 'Matriz',
    operation: 'sankhya.consultar',
    input: { sql: 'SELECT 1' },
  })
  await runOn(set, 'concept_propose', RENAME)
  assert.deepEqual(seen[0], {
    connectionId: SANKHYA,
    operation: 'consultar',
    input: { sql: 'SELECT 1' },
    personId: person,
    runId: RUN,
    signal: undefined,
  })
  assert.deepEqual(seen[1], { connectionId: SANKHYA, personId: person, runId: RUN })
  assert.deepEqual(proposed, [{ connectionId: SANKHYA, items: RENAME.items }])
})

test('uma ferramenta chamada fora de uma corrida do Builder lança CONNECTOR_TOOL_WITHOUT_RUN, e nada chega à porta', async () => {
  const calls: unknown[] = []
  const port: BuilderConnectors = {
    granted: async () => [],
    provePage: async () => ({ kind: 'NOT_GRANTED' }),
    propose: async () => ({ kind: 'NOT_GRANTED' }),
    read: async (...args) => {
      calls.push(args)
      return { kind: 'NOT_GRANTED' }
    },
    concepts: async (...args) => {
      calls.push(args)
      return undefined
    },
  }
  const { access, concepts } = builderAccess(
    port,
    ontologyOf(calls),
    [granted('sankhya', SANKHYA)],
    {
      ...Object(ids()),
      personId: PersonId.parse('66666666-6666-4666-8666-666666666666'),
      runIdOf: () => undefined,
    },
    QUIET,
  )
  const set = connectorTools(access, { concepts })
  const read = { connection: 'Matriz', operation: 'sankhya.consultar', input: {} }
  function refusal(error: unknown) {
    return Object(error).details?.reason === 'CONNECTOR_TOOL_WITHOUT_RUN'
  }
  await assert.rejects(runOn(set, 'connector_read', read), refusal)
  await assert.rejects(runOn(set, 'concept_propose', RENAME), refusal)
  assert.deepEqual(calls, [])
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
  const set = connectorTools(access)
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

test('a proposta a um conector que a ligação não tem é NOT_GRANTED, e nada é proposto', async () => {
  const proposed: unknown[] = []
  const { access } = accessOver([granted('sankhya', SANKHYA)])
  const set = connectorTools(access, {
    concepts: async (call) => {
      proposed.push(call)
      return PROPOSED
    },
  })
  assert.deepEqual(await runOn(set, 'concept_propose', { ...RENAME, connector: 'outro' }), {
    kind: 'NOT_GRANTED',
  })
  assert.deepEqual(proposed, [])
})

test('a proposta recusa a demanda vazia ou longa e a lista vazia ou de mais de 40 itens', async () => {
  const proposed: unknown[] = []
  const { access } = accessOver([granted('sankhya', SANKHYA)])
  const set = connectorTools(access, {
    concepts: async (call) => {
      proposed.push(call)
      return PROPOSED
    },
  })
  const [item] = RENAME.items
  for (const refused of [
    { ...RENAME, demand: '' },
    { ...RENAME, demand: 'x'.repeat(501) },
    { ...RENAME, items: [] },
    { ...RENAME, items: Array.from({ length: 41 }, () => item) },
  ])
    assert.equal((await runOn(set, 'concept_propose', refused)).error, true)
  assert.equal(
    (await runOn(set, 'concept_propose', { ...RENAME, demand: 'x'.repeat(500) })).kind,
    'PROPOSED',
  )
  assert.equal(proposed.length, 1)
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
  const set = connectorTools(withMachine.access)
  const saved = await runOn(set, 'connector_read', read, { workspace: { filesystem: files } })
  assert.deepEqual(written, ['reads/aaaa-1.json'])
  assert.equal(saved.file, 'reads/aaaa-1.json')
  assert.equal('whole' in saved, false)

  const spent = accessOver([granted('sankhya', SANKHYA)], {
    read: async () => ({ kind: 'CALLS_SPENT' }),
    savedAt: () => 'reads/aaaa-2.json',
  })
  const refused = await runOn(connectorTools(spent.access), 'connector_read', read, {
    workspace: { filesystem: files },
  })
  assert.deepEqual(refused, { kind: 'CALLS_SPENT' })
  assert.equal(written.length, 1, 'a refusal is not written')

  const noMachine = await runOn(set, 'connector_read', read)
  assert.deepEqual(
    [noMachine.kind, 'file' in noMachine, 'saved' in noMachine],
    ['OK', false, false],
  )
  const noPath = accessOver([granted('sankhya', SANKHYA)], { read: async () => whole })
  const cut = await runOn(connectorTools(noPath.access), 'connector_read', read, {
    workspace: { filesystem: files },
  })
  assert.deepEqual(
    [cut.kind, 'file' in cut, 'saved' in cut, 'whole' in cut],
    ['OK', false, false, false],
  )
  assert.equal(written.length, 1)
})

async function concepts() {
  return { kind: 'NOT_GRANTED' } as const
}

test('uma ligação sem leituras não leva a ferramenta de leitura, mas leva a proposta; sem ligações nenhuma ferramenta', () => {
  const none = { ...accessOver([]).access }
  assert.deepEqual(Object.keys(connectorTools(none, { concepts })), [])
  const noReads = accessOver([{ ...granted('sankhya', SANKHYA), reads: [] }]).access
  assert.deepEqual(Object.keys(connectorTools(noReads)), [])
  assert.deepEqual(Object.keys(connectorTools(noReads, { concepts })), ['concept_propose'])
})
