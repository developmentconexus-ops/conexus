import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type {
  Catalog,
  CatalogTable,
  CompanyData,
  DataSources,
  ReadRequest,
} from './company-data.ts'
import { ActAnswer, companyData, Described, ReadAnswer } from './company-data.ts'
import { queryLaws } from './company-data-query-conformance.ts'
import { roleLaws } from './company-data-role-conformance.ts'
import type { DataWorld } from './company-data-world.ts'
import { ConversationId } from './conversations.ts'
import { ToolCallId } from './questions.ts'
import { OperationId } from './tools.ts'

const AT = new Date('2026-11-14T12:00:00.000Z')
const UNKNOWN = OperationId.parse('naoDeclarada')
const CALL = {
  thread: ConversationId.parse('00000000-0000-4000-8000-000000000001'),
  toolCall: ToolCallId.parse('call-1'),
}
const NOTHING_REACHED = { live: [], rows: [], funnel: [] }

function reachedNothing(world: DataWorld): void {
  const { live, rows, funnel } = world.reached
  assert.deepEqual({ live, rows, funnel }, NOTHING_REACHED)
}

async function catalogOf(world: DataWorld): Promise<Catalog> {
  const described = Described.parse(await world.sources.catalog({}))
  assert.equal(described.kind, 'CATALOG')
  return described
}

function operationOf({ kept: { source } }: CatalogTable): string | null {
  return source.kind === 'OPERATION' ? source.operation : null
}

function keptInput({ kept: { source } }: CatalogTable): Readonly<Record<string, unknown>> | null {
  return source.kind === 'OPERATION' ? source.input : null
}

async function fixturesOf(world: DataWorld) {
  const catalog = await catalogOf(world)
  const table = catalog.tables.find((one) => Object.keys(keptInput(one) ?? {}).length > 0)
  assert.ok(table && table.kept.source.kind === 'OPERATION', 'a copy of a read with a fixed input')
  const [connection] = table.kept.connections
  assert.ok(connection, 'the connection the copy reads')
  const { operation, input } = table.kept.source
  const copied = { connection, operation: OperationId.parse(operation), input }
  const live = catalog.systems
    .flatMap((system) => system.reads.map((read) => ({ ...read, connection: system.connection })))
    .find((read) => !catalog.tables.some((one) => operationOf(one) === read.operation))
  assert.ok(live, 'a read no copy serves')
  const query = catalog.tables.find((one) => one.kept.source.kind === 'QUERY')
  assert.ok(query, 'a copy that copies no read')
  const system = catalog.systems.find((one) => one.actions.length > 0)
  const [declared] = system?.actions ?? []
  assert.ok(system && declared, 'a system with an action')
  const action = { connection: system.connection, operation: OperationId.parse(declared.operation) }
  const liveRead = {
    connection: live.connection,
    operation: OperationId.parse(live.operation),
    input: {},
  }
  return { catalog, table, copied, live: liveRead, query, action }
}

function assertTable(world: DataWorld, answer: ReadAnswer, table: CatalogTable): void {
  const [page] = world.gave.rows
  assert.ok(page?.kind === 'ROWS', 'the page whoever keeps the table gave')
  const { rows, complete } = page
  assert.deepEqual(answer, { kind: 'TABLE', table: table.name, kept: table.kept, rows, complete })
  assert.deepEqual(world.reached.rows, [table.name])
}

function assertLive(world: DataWorld, answers: readonly ReadAnswer[]): void {
  const at = AT.toISOString()
  assert.deepEqual(
    answers,
    world.gave.live.map((gave) => ({ ...gave, kind: 'LIVE', at })),
  )
}

async function readsOnlyLive(
  world: DataWorld,
  data: CompanyData,
  read: Omit<Extract<ReadRequest, { kind: 'OPERATION' }>, 'kind'>,
): Promise<void> {
  const answer = ReadAnswer.parse(await data.read({ kind: 'OPERATION', ...read }))
  assertLive(world, [answer])
  assert.deepEqual(world.reached.live, [read])
  assert.deepEqual(world.reached.rows, [])
}

type Law = (world: DataWorld, data: CompanyData) => Promise<void>

async function describesSystemsAndTables(world: DataWorld, data: CompanyData): Promise<void> {
  const { catalog } = await fixturesOf(world)
  assert.deepEqual(await data.describe(), catalog)
  for (const system of catalog.systems) assert.ok(system.reads.length > 0, system.name)
  for (const table of catalog.tables) {
    assert.ok(table.columns.length > 0, table.name)
    assert.ok(
      table.columns.some((column) => column.description !== null),
      table.name,
    )
  }
  assert.ok(catalog.tables.some((table) => table.kept.lastRun?.outcome.kind === 'PARTIAL'))
}

export async function keepsLiveOnlyOutOfTables(world: DataWorld, data: CompanyData): Promise<void> {
  const catalog = await catalogOf(world)
  const live = catalog.systems.filter((system) => system.liveOnly)
  assert.ok(live.length > 0, 'a live-only system in the world')
  for (const system of live)
    for (const table of catalog.tables)
      assert.ok(
        !table.kept.connections.includes(system.connection),
        `${table.name} kept from ${system.name}`,
      )
  assert.deepEqual(await data.describe(), catalog)
}

async function readsTheCopy(world: DataWorld, data: CompanyData): Promise<void> {
  const { copied, table } = await fixturesOf(world)
  const answer = ReadAnswer.parse(await data.read({ kind: 'OPERATION', ...copied }))
  assertTable(world, answer, table)
  assert.deepEqual(world.reached.live, [])
}

async function readsTheCopyWithoutInput(world: DataWorld, data: CompanyData): Promise<void> {
  const { catalog } = await fixturesOf(world)
  const table = catalog.tables.find((one) => {
    const input = keptInput(one)
    return input !== null && Object.keys(input).length === 0
  })
  assert.ok(table && table.kept.source.kind === 'OPERATION', 'a copy of a read with no input')
  const [connection] = table.kept.connections
  assert.ok(connection, 'the connection the copy reads')
  const operation = OperationId.parse(table.kept.source.operation)
  const answer = await data.read({ kind: 'OPERATION', connection, operation, input: undefined })
  assertTable(world, ReadAnswer.parse(answer), table)
  assert.deepEqual(world.reached.live, [])
}

async function readsLiveAnotherInput(world: DataWorld, data: CompanyData): Promise<void> {
  const { copied } = await fixturesOf(world)
  const otherValues = Object.fromEntries(Object.keys(copied.input).map((field) => [field, '-']))
  const inputs = [{ ...copied.input, outro: 'campo' }, {}, otherValues]
  const answers: ReadAnswer[] = []
  for (const input of inputs)
    answers.push(ReadAnswer.parse(await data.read({ kind: 'OPERATION', ...copied, input })))
  assertLive(world, answers)
  const { connection, operation } = copied
  assert.deepEqual(
    world.reached.live,
    inputs.map((input) => ({ connection, operation, input })),
  )
  assert.deepEqual(world.reached.rows, [])
}

async function readsLiveAnotherRead(world: DataWorld, data: CompanyData): Promise<void> {
  const { catalog, copied } = await fixturesOf(world)
  const other = catalog.systems
    .find(({ connection }) => connection === copied.connection)
    ?.reads.find(({ operation }) => operation !== copied.operation)
  assert.ok(other, 'another read of the connection the copy reads')
  const read = { ...copied, operation: OperationId.parse(other.operation) }
  await readsOnlyLive(world, data, read)
}

async function readsLiveAnotherConnection(world: DataWorld, data: CompanyData): Promise<void> {
  const { catalog, copied, table } = await fixturesOf(world)
  const other = catalog.systems.find(
    ({ connection, reads }) =>
      !table.kept.connections.includes(connection) &&
      reads.some(({ operation }) => operation === copied.operation),
  )
  assert.ok(other, 'another connection with the read the copy keeps')
  const read = { ...copied, connection: other.connection }
  await readsOnlyLive(world, data, read)
}

async function readsLiveWithoutCopy(world: DataWorld, data: CompanyData): Promise<void> {
  const { live } = await fixturesOf(world)
  await readsOnlyLive(world, data, live)
}

async function readsTableByName(world: DataWorld, data: CompanyData): Promise<void> {
  const { query } = await fixturesOf(world)
  const answer = ReadAnswer.parse(await data.read({ kind: 'TABLE', table: query.name }))
  assertTable(world, answer, query)
}

async function refusesReadOutsideCatalog(world: DataWorld, data: CompanyData): Promise<void> {
  const { live, action } = await fixturesOf(world)
  const answers = [
    await data.read({ kind: 'TABLE', table: 'nao_existe' }),
    await data.read({ kind: 'OPERATION', ...live, operation: UNKNOWN }),
    await data.read({ kind: 'OPERATION', ...action, input: {} }),
  ]
  for (const answer of answers) assert.deepEqual(answer, { kind: 'NOT_IN_CATALOG' })
  reachedNothing(world)
}

async function actsThroughTheFunnel(world: DataWorld, data: CompanyData): Promise<void> {
  const { action } = await fixturesOf(world)
  const request = { ...action, input: { valor: 1 }, call: CALL }
  const answer = ActAnswer.parse(await data.act(request))
  assert.deepEqual(world.reached.funnel, [request])
  assert.deepEqual([answer], world.gave.funnel)
  assert.deepEqual(world.reached.live, [])
}

async function refusesActOutsideCatalog(world: DataWorld, data: CompanyData): Promise<void> {
  const { live, action } = await fixturesOf(world)
  const answers = [
    await data.act({ ...live, call: CALL }),
    await data.act({ ...action, operation: UNKNOWN, input: {}, call: CALL }),
  ]
  for (const answer of answers) assert.deepEqual(answer, { kind: 'NOT_IN_CATALOG' })
  assert.deepEqual(world.reached.funnel, [])
}

async function keepsTableWhenItsKeeperIsDown(world: DataWorld, data: CompanyData): Promise<void> {
  const { copied } = await fixturesOf(world)
  world.down('rows')
  const answer = ReadAnswer.parse(await data.read({ kind: 'OPERATION', ...copied }))
  assert.deepEqual([answer], world.gave.rows)
  assert.equal(answer.kind, 'TABLE_UNAVAILABLE')
  assert.deepEqual(world.reached.live, [])
}

async function callsNothingWithoutCatalog(world: DataWorld, data: CompanyData): Promise<void> {
  const { live, action } = await fixturesOf(world)
  world.down('catalog')
  const unavailable = { kind: 'CATALOG_UNAVAILABLE' }
  assert.deepEqual(await data.describe(), unavailable)
  assert.deepEqual(await data.read({ kind: 'OPERATION', ...live }), unavailable)
  assert.deepEqual(await data.act({ ...action, input: {}, call: CALL }), unavailable)
  reachedNothing(world)
}

async function passesTheSignalToEverySource(world: DataWorld, data: CompanyData): Promise<void> {
  const { copied, live, action } = await fixturesOf(world)
  const { signal } = new AbortController()
  const before = world.reached.signals.length
  await data.describe({ signal })
  await data.read({ kind: 'OPERATION', ...copied, signal })
  await data.read({ kind: 'OPERATION', ...live, signal })
  await data.act({ ...action, input: {}, call: CALL, signal })
  const passed = world.reached.signals.slice(before)
  assert.equal(passed.length, 7, 'the catalog four times, the rows, the live read and the funnel')
  assert.ok(passed.every((one) => one === signal))
}

const LAWS: readonly (readonly [string, Law])[] = [
  [
    'descreve os sistemas e as tabelas, cada tabela com a descrição, o significado das colunas e a última rodada',
    describesSystemsAndTables,
  ],
  [
    'descreve o sistema só ao vivo com liveOnly e nenhuma tabela o tem como origem',
    keepsLiveOnlyOutOfTables,
  ],
  [
    'lê da tabela a leitura que uma cópia guarda, sem chamar o sistema, com as linhas e quem as guarda',
    readsTheCopy,
  ],
  [
    'lê da tabela a leitura sem entrada quando a cópia não fixa entrada nenhuma',
    readsTheCopyWithoutInput,
  ],
  [
    'lê ao vivo, com a hora e a entrada pedida, a mesma leitura com uma entrada que não é a que a cópia fixa',
    readsLiveAnotherInput,
  ],
  [
    'lê ao vivo outra leitura da mesma conexão, ainda que com a entrada que a cópia fixa',
    readsLiveAnotherRead,
  ],
  ['lê ao vivo a mesma leitura numa conexão que a cópia não lê', readsLiveAnotherConnection],
  ['lê ao vivo a leitura que nenhuma tabela guarda, com o valor do sistema', readsLiveWithoutCopy],
  ['lê pelo nome a tabela que não guarda leitura nenhuma', readsTableByName],
  [
    'recusa, sem chamar nada, a leitura ou a tabela fora do catálogo e a ação lida como leitura',
    refusesReadOutsideCatalog,
  ],
  ...roleLaws,
  ...queryLaws,
  [
    'age só pelo funil, uma vez, com o pedido e a chamada intactos, e devolve a resposta do funil',
    actsThroughTheFunnel,
  ],
  [
    'recusa, sem passar pelo funil, a ação fora do catálogo e a leitura pedida como ação',
    refusesActOutsideCatalog,
  ],
  [
    'com quem guarda a tabela parado, ela não é lida ao vivo no lugar',
    keepsTableWhenItsKeeperIsDown,
  ],
  ['sem catálogo, nenhum verbo chama o sistema, a tabela ou o funil', callsNothingWithoutCatalog],
  ['passa o sinal de cancelamento a cada fonte que chama', passesTheSignalToEverySource],
]

/** What every implementation of the data track's sources passes against its fake connector, with no network. */
export function runDataConformance(name: string, make: () => DataWorld): void {
  describe(name, () => {
    for (const [law, run] of LAWS)
      it(law, async () => {
        const world = make()
        await run(world, companyData({ sources: world.sources, now: () => AT }))
      })
  })
}
