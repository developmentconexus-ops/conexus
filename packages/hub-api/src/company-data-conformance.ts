import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { Catalog, CatalogTable, CompanyData, DataSources } from './company-data.ts'
import { ActAnswer, companyData, Described, ReadAnswer } from './company-data.ts'
import { ConversationId } from './conversations.ts'
import { ToolCallId } from './questions.ts'
import { OperationId } from './tools.ts'

/** A fake connector behind the data track's sources, and what each call reached. */
export type DataWorld = Readonly<{
  sources: DataSources
  reached: Readonly<{ live: unknown[]; rows: string[]; funnel: unknown[] }>
  /** The Hub's database or whoever keeps the tables stops answering, until the world is made again. */
  down(part: 'catalog' | 'rows'): void
}>

const AT = new Date('2026-11-14T12:00:00.000Z')
const UNKNOWN = OperationId.parse('naoDeclarada')
const CALL = {
  thread: ConversationId.parse('00000000-0000-4000-8000-000000000001'),
  toolCall: ToolCallId.parse('call-1'),
}
const NOTHING_REACHED = { live: [], rows: [], funnel: [] }

async function catalogOf(world: DataWorld): Promise<Catalog> {
  const described = Described.parse(await world.sources.catalog({}))
  assert.equal(described.kind, 'CATALOG')
  return described
}

function operationOf({ kept: { source } }: CatalogTable): string | null {
  return source.kind === 'OPERATION' ? source.operation : null
}

async function fixturesOf(world: DataWorld) {
  const catalog = await catalogOf(world)
  const table = catalog.tables.find((one) => operationOf(one) !== null)
  assert.ok(table && table.kept.source.kind === 'OPERATION', 'a copy of a read')
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
  const action = { connection: system.connection, operation: declared.operation }
  const liveRead = { connection: live.connection, operation: live.operation, input: {} }
  return { catalog, table, copied, live: liveRead, query, action }
}

type Law = (world: DataWorld, data: CompanyData) => Promise<void>

async function describesSystemsAndTables(world: DataWorld): Promise<void> {
  const { catalog } = await fixturesOf(world)
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

async function readsTheCopy(world: DataWorld, data: CompanyData): Promise<void> {
  const { copied, table } = await fixturesOf(world)
  const answer = ReadAnswer.parse(await data.read({ kind: 'OPERATION', ...copied }))
  assert.equal(answer.kind, 'TABLE')
  assert.equal(answer.kind === 'TABLE' && answer.table, table.name)
  assert.deepEqual(answer.kind === 'TABLE' && answer.kept, table.kept)
  assert.deepEqual(world.reached.live, [])
  assert.deepEqual(world.reached.rows, [table.name])
}

async function readsLiveAnotherInput(world: DataWorld, data: CompanyData): Promise<void> {
  const { copied } = await fixturesOf(world)
  const otherValues = Object.fromEntries(Object.keys(copied.input).map((field) => [field, '-']))
  for (const input of [{ ...copied.input, outro: 'campo' }, {}, otherValues]) {
    const answer = ReadAnswer.parse(await data.read({ kind: 'OPERATION', ...copied, input }))
    assert.equal(answer.kind === 'LIVE' && answer.at, AT.toISOString())
  }
  assert.deepEqual(world.reached.rows, [])
  assert.equal(world.reached.live.length, 3)
}

async function readsLiveAnotherRead(world: DataWorld, data: CompanyData): Promise<void> {
  const { catalog, copied } = await fixturesOf(world)
  const other = catalog.systems
    .find(({ connection }) => connection === copied.connection)
    ?.reads.find(({ operation }) => operation !== copied.operation)
  assert.ok(other, 'another read of the connection the copy reads')
  const read = { ...copied, operation: other.operation }
  const answer = ReadAnswer.parse(await data.read({ kind: 'OPERATION', ...read }))
  assert.equal(answer.kind, 'LIVE')
  assert.deepEqual(world.reached.rows, [])
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
  const answer = ReadAnswer.parse(await data.read({ kind: 'OPERATION', ...read }))
  assert.equal(answer.kind, 'LIVE')
  assert.deepEqual(world.reached.rows, [])
}

async function readsLiveWithoutCopy(world: DataWorld, data: CompanyData): Promise<void> {
  const { live } = await fixturesOf(world)
  const answer = ReadAnswer.parse(await data.read({ kind: 'OPERATION', ...live }))
  assert.equal(answer.kind, 'LIVE')
  assert.deepEqual(world.reached.live, [live])
}

async function readsTableByName(world: DataWorld, data: CompanyData): Promise<void> {
  const { query } = await fixturesOf(world)
  const answer = ReadAnswer.parse(await data.read({ kind: 'TABLE', table: query.name }))
  assert.equal(answer.kind, 'TABLE')
  assert.deepEqual(world.reached.rows, [query.name])
}

async function refusesReadOutsideCatalog(world: DataWorld, data: CompanyData): Promise<void> {
  const { live, action } = await fixturesOf(world)
  const answers = [
    await data.read({ kind: 'TABLE', table: 'nao_existe' }),
    await data.read({ kind: 'OPERATION', ...live, operation: UNKNOWN }),
    await data.read({ kind: 'OPERATION', ...action, input: {} }),
  ]
  for (const answer of answers) assert.equal(ReadAnswer.parse(answer).kind, 'NOT_IN_CATALOG')
  assert.deepEqual(world.reached, NOTHING_REACHED)
}

async function actsThroughTheFunnel(world: DataWorld, data: CompanyData): Promise<void> {
  const { action } = await fixturesOf(world)
  const request = { ...action, input: { valor: 1 }, call: CALL }
  const answer = ActAnswer.parse(await data.act(request))
  assert.notEqual(answer.kind, 'NOT_IN_CATALOG')
  assert.equal(world.reached.funnel.length, 1)
  assert.deepEqual(world.reached.live, [])
}

async function refusesActOutsideCatalog(world: DataWorld, data: CompanyData): Promise<void> {
  const { live, action } = await fixturesOf(world)
  const answers = [
    await data.act({ ...live, call: CALL }),
    await data.act({ ...action, operation: UNKNOWN, input: {}, call: CALL }),
  ]
  for (const answer of answers) assert.equal(ActAnswer.parse(answer).kind, 'NOT_IN_CATALOG')
  assert.deepEqual(world.reached.funnel, [])
}

async function keepsTableWhenItsKeeperIsDown(world: DataWorld, data: CompanyData): Promise<void> {
  const { copied } = await fixturesOf(world)
  world.down('rows')
  const answer = ReadAnswer.parse(await data.read({ kind: 'OPERATION', ...copied }))
  assert.equal(answer.kind, 'TABLE_UNAVAILABLE')
  assert.deepEqual(world.reached.live, [])
}

async function callsNothingWithoutCatalog(world: DataWorld, data: CompanyData): Promise<void> {
  const { live, action } = await fixturesOf(world)
  world.down('catalog')
  assert.equal((await data.describe()).kind, 'CATALOG_UNAVAILABLE')
  const read = await data.read({ kind: 'OPERATION', ...live })
  assert.equal(ReadAnswer.parse(read).kind, 'CATALOG_UNAVAILABLE')
  const acted = await data.act({ ...action, input: {}, call: CALL })
  assert.equal(ActAnswer.parse(acted).kind, 'CATALOG_UNAVAILABLE')
  assert.deepEqual(world.reached, NOTHING_REACHED)
}

const LAWS: readonly (readonly [string, Law])[] = [
  [
    'descreve cada sistema com leituras e ações, e cada tabela com o significado das colunas e a última rodada',
    describesSystemsAndTables,
  ],
  [
    'lê da tabela a leitura que uma cópia guarda, sem chamar o sistema, com quem a guarda',
    readsTheCopy,
  ],
  [
    'lê ao vivo, com a hora, a mesma leitura com uma entrada que não é a que a cópia fixa',
    readsLiveAnotherInput,
  ],
  [
    'lê ao vivo outra leitura da mesma conexão, ainda que com a entrada que a cópia fixa',
    readsLiveAnotherRead,
  ],
  ['lê ao vivo a mesma leitura numa conexão que a cópia não lê', readsLiveAnotherConnection],
  ['lê ao vivo a leitura que nenhuma tabela guarda', readsLiveWithoutCopy],
  ['lê pelo nome a tabela que não guarda leitura nenhuma', readsTableByName],
  [
    'recusa, sem chamar nada, a leitura ou a tabela fora do catálogo e a ação lida como leitura',
    refusesReadOutsideCatalog,
  ],
  ['age só pelo funil, uma vez, e devolve a resposta do funil', actsThroughTheFunnel],
  [
    'recusa, sem passar pelo funil, a ação fora do catálogo e a leitura pedida como ação',
    refusesActOutsideCatalog,
  ],
  [
    'com quem guarda a tabela parado, ela não é lida ao vivo no lugar',
    keepsTableWhenItsKeeperIsDown,
  ],
  ['sem catálogo, nenhum verbo chama o sistema, a tabela ou o funil', callsNothingWithoutCatalog],
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
