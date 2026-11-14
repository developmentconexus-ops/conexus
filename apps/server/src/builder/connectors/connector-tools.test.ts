import assert from 'node:assert/strict'
import { test } from 'node:test'
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

const PROPOSAL = OntologyProposalId.parse('77777777-7777-4777-8777-777777777777')

function tools() {
  const seen: { proposed: string[] } = { proposed: [] }
  const port: BuilderConnectors = {
    granted: async () => [],
    provePage: async () => ({ kind: 'NOT_GRANTED' }),
    propose: async () => ({ kind: 'NOT_GRANTED' }),
    read: async () => ({ kind: 'NOT_GRANTED' }),
    concepts: async (_ids, a) => ({
      connectionId: a.connectionId,
      prove: async () => ({ kind: 'CALLS_SPENT' }),
      query: async () => ({ kind: 'CALLS_SPENT' }),
    }),
  }
  const ontology: OntologyDoor = {
    search: async () => ({ kind: 'EMPTY' }),
    propose: async (input) => {
      seen.proposed.push(input.door.connectionId)
      return { kind: 'PROPOSED', proposalId: PROPOSAL, baseRevision: 0, items: [], refused: [] }
    },
  }
  const ids = {
    companyId: '44444444444444444444444444444444',
    projectId: '55555555555555555555555555555555',
  }
  const { access, concepts } = builderAccess(
    port,
    ontology,
    [granted('mercado-livre', LOJA), granted('sankhya', SANKHYA)],
    {
      ...Object(ids),
      personId: PersonId.parse('66666666-6666-4666-8666-666666666666'),
      runIdOf: () => RUN,
    },
    { info: () => undefined, error: () => undefined },
  )
  const set = connectorTools(access, { concepts })
  function run(name: string, input: object) {
    const found = Object(set)[name]
    return found.execute(input, { requestContext: new RequestContext() })
  }
  return { run, seen, set }
}

const RENAME = {
  demand: 'o nome do pedido',
  items: [{ kind: 'RENAME_LABEL', target: 'pedido', name: 'Pedido' }],
}

test('duas ligações de mesmo nome em conectores diferentes: a proposta vai à do conector dito', async () => {
  const { run, seen } = tools()
  const answered = await run('concept_propose', {
    ...RENAME,
    connection: 'Matriz',
    connector: 'sankhya',
  })
  assert.equal(answered.kind, 'PROPOSED')
  assert.deepEqual(seen.proposed, [SANKHYA])
})

test('sem o conector, o nome que duas ligações têm é ambíguo e nada é chamado', async () => {
  const { run, seen } = tools()
  assert.equal(
    (await run('concept_propose', { ...RENAME, connection: 'Matriz' })).kind,
    'AMBIGUOUS_CONNECTION',
  )
  assert.deepEqual(seen.proposed, [])
})

test('um nome que nenhuma ligação liberada tem é recusado pelo esquema da ferramenta, que diz os nomes, e nada é chamado', async () => {
  const { run, seen } = tools()
  const refused = await run('concept_propose', { ...RENAME, connection: 'Filial' })
  assert.equal(refused.error, true)
  assert.match(refused.message, /connection: Invalid input: expected "Matriz"/)
  assert.deepEqual(seen.proposed, [])
})

function savingTo(files: { writeFile(path: string, content: string): Promise<void> }) {
  const logged: { fields: Record<string, unknown>; message: string }[] = []
  const signals: (AbortSignal | undefined)[] = []
  const access: ConnectorAccess = {
    connections: [granted('sankhya', SANKHYA)],
    read: async (call) => {
      signals.push(call.signal)
      return {
        kind: 'OK',
        value: { linhas: [] },
        complete: true,
        rows: 0,
        bytes: 14,
        whole: { linhas: [] },
      }
    },
    savedAt: () => 'reads/aaaa-1.json',
    log: {
      info: (fields, message) => logged.push({ fields, message }),
      error: (fields, message) => logged.push({ fields, message }),
    },
    wording: { whose: 'x', limit: 'y' },
  }
  const set = connectorTools(access)
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

test('a ligação de um sistema com a leitura de outro: a ferramenta recusa dizendo de quem é cada uma, fica no registro, e nenhuma porta é chamada (F-A)', async () => {
  const logged: { fields: Record<string, unknown>; message: string }[] = []
  const reads: unknown[] = []
  const access: ConnectorAccess = {
    connections: [granted('sankhya', SANKHYA, 'Sankhya'), granted('mercado-livre', LOJA, 'Loja')],
    read: async (call) => {
      reads.push(call)
      return { kind: 'OK', value: {}, complete: true, rows: 0, bytes: 2 }
    },
    log: {
      info: (fields, message) => logged.push({ fields, message }),
      error: (fields, message) => logged.push({ fields, message }),
    },
    wording: { whose: 'x', limit: 'y' },
  }
  const set = connectorTools(access)
  const refused = await Object(set).connector_read.execute(
    { connection: 'Sankhya', operation: 'mercado-livre.consultar', input: {} },
    { requestContext: new RequestContext() },
  )
  assert.equal(refused.kind, 'NOT_GRANTED')
  assert.match(refused.reason, /"Sankhya" is of sankhya; the operation mercado-livre\.consultar/)
  assert.deepEqual(reads, [], 'the Sankhya connection was not asked for a Mercado Livre read')
  assert.deepEqual(logged, [
    {
      message: 'CONNECTOR_READ_REFUSED',
      fields: {
        connectionIds: SANKHYA,
        operation: 'mercado-livre.consultar',
        reason: 'OTHER_SYSTEM',
      },
    },
  ])
})

test('uma operação que o papel não tem chega à porta e o modelo recebe NOT_IN_ROLE com o papel, sem a entrada, não um erro de esquema', async () => {
  const asked: string[] = []
  const access: ConnectorAccess = {
    connections: [granted('sankhya', SANKHYA)].map((one) => ({
      ...one,
      reads: [{ operation: 'pedidos', label: 'Pedidos', summary: 'pedidos' }],
    })),
    read: async (call) => {
      asked.push(call.operation)
      return call.operation === 'pedidos'
        ? { kind: 'OK', value: {}, complete: true, rows: 0, bytes: 2 }
        : { kind: 'NOT_IN_ROLE', role: 'atendente', operation: call.operation }
    },
    log: { info: () => undefined, error: () => undefined },
    wording: { whose: 'x', limit: 'y' },
  }
  const read = Object(connectorTools(access)).connector_read
  const refused = await read.execute(
    { connection: 'Matriz', operation: 'sankhya.contasAReceber', input: { secret: 'x' } },
    { requestContext: new RequestContext() },
  )
  assert.deepEqual(refused, {
    kind: 'NOT_IN_ROLE',
    role: 'atendente',
    operation: 'contasAReceber',
  })
  assert.deepEqual(asked, ['contasAReceber'])
})

test('uma operação que não tem a forma conector.operação é erro de esquema e nunca chega à porta nem ao registro (S41)', async () => {
  const logged: string[] = []
  const asked: string[] = []
  const access: ConnectorAccess = {
    connections: [granted('sankhya', SANKHYA)],
    read: async (call) => {
      asked.push(call.operation)
      return { kind: 'NOT_GRANTED' }
    },
    log: {
      info: (fields, message) => logged.push(JSON.stringify({ fields, message })),
      error: (fields, message) => logged.push(JSON.stringify({ fields, message })),
    },
    wording: { whose: 'x', limit: 'y' },
  }
  const read = Object(connectorTools(access)).connector_read
  const planted = `sankhya.${'x'.repeat(5000)}`
  for (const operation of [planted, 'sem ponto', `${'a'.repeat(100)}.pedidos`]) {
    const refused = await read.execute(
      { connection: 'Matriz', operation, input: {} },
      { requestContext: new RequestContext() },
    )
    assert.equal(refused.error, true)
  }
  assert.deepEqual(asked, [])
  assert.ok(!logged.join('').includes('xxxxx'))
})

test('a frase do arquivo: o que está inteiro no arquivo não se lê de novo, e sem arquivo se filtra', () => {
  const { set } = tools()
  const description = String(Object(Object(set).connector_read).description)
  assert.match(
    description,
    /`complete` is false and `file` is set, the whole answer is in that file/,
  )
  assert.match(description, /open it with Python on the machine/)
  assert.match(description, /Do not read again to see the rest/)
  assert.match(description, /`saved` is false there is no file: filter with WHERE and COUNT/)
  assert.doesNotMatch(description, /run your own SQL/)
})

test('uma leitura que o fornecedor recusou por erro do pedido chega ao modelo como falha a corrigir, com a mensagem; só o 403 segue como recusa de acesso', async () => {
  const native = { status: 200, code: '0', body: null }
  const answers = [
    {
      kind: 'REFUSED',
      native: { ...native, message: 'ORA-00904: "VLRCRED": identificador inválido' },
    },
    { kind: 'REFUSED', native: { ...native, message: null } },
    { kind: 'REFUSED', native: { ...native, status: 403, message: 'Sem permissão' } },
  ] as const
  let next = 0
  const access: ConnectorAccess = {
    connections: [granted('sankhya', SANKHYA)],
    read: async () => answers[next++] ?? { kind: 'NOT_GRANTED' },
    log: { info: () => undefined, error: () => undefined },
    wording: { whose: 'x', limit: 'y' },
  }
  const read = Object(connectorTools(access)).connector_read
  function ask() {
    return read.execute(
      { connection: 'Matriz', operation: 'sankhya.consultar', input: {} },
      { requestContext: new RequestContext() },
    )
  }
  const failed = await ask()
  assert.equal(failed.kind, 'READ_FAILED')
  assert.match(failed.reason, /The read failed\. The provider said: ORA-00904: "VLRCRED"/)
  assert.match(
    failed.reason,
    /does not show a refusal of access: read the message, correct the request and try another way/,
  )
  assert.match(failed.reason, /try another way/)
  const silent = await ask()
  assert.equal(silent.kind, 'READ_FAILED')
  assert.doesNotMatch(silent.reason, /provider said/)
  assert.deepEqual(await ask(), {
    kind: 'REFUSED',
    native: { ...native, status: 403, message: 'Sem permissão' },
  })
})
