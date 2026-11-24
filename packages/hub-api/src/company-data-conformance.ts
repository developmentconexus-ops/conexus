import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import { describe, it } from 'node:test'
import type { CompanyData } from './company-data.ts'
import { ActAnswer, companyData, ReadAnswer } from './company-data.ts'
import { fixturesOf, OUTSIDE_QUERY } from './company-data-fixtures.ts'
import { recordLaws } from './company-data-record-conformance.ts'
import type { DataWorld } from './company-data-world.ts'

export type { DataWorld } from './company-data-world.ts'

import { ConversationId } from './conversations.ts'
import { ToolCallId } from './questions.ts'
import { OperationId } from './tools.ts'

/** The clock the laws read a live answer's hour by; a world that binds its contract binds it to this. */
export const LAWS_AT = new Date('2026-11-14T12:00:00.000Z')
const UNKNOWN = OperationId.parse('naoDeclarada')
const CALL = {
  thread: ConversationId.parse('00000000-0000-4000-8000-000000000001'),
  toolCall: ToolCallId.parse('call-1'),
}

function reachedNothing(world: DataWorld): void {
  const { live, funnel } = world.reached
  assert.deepEqual({ live, funnel }, { live: [], funnel: [] })
}

type Law = (world: DataWorld, data: CompanyData) => Promise<void>

async function describesSystems(world: DataWorld, data: CompanyData): Promise<void> {
  const { catalog } = await fixturesOf(world)
  assert.deepEqual(await data.describe(), catalog)
  for (const system of catalog.systems) assert.ok(system.reads.length > 0, system.name)
}

async function readsLive(world: DataWorld, data: CompanyData): Promise<void> {
  const { live } = await fixturesOf(world)
  const answer = ReadAnswer.parse(await data.read({ kind: 'OPERATION', ...live }))
  const at = LAWS_AT.toISOString()
  assert.deepEqual(
    [answer],
    world.gave.live.map((gave) => ({ ...gave, kind: 'LIVE', at })),
  )
  assert.deepEqual(world.reached.live, [live])
}

async function refusesReadOutsideCatalog(world: DataWorld, data: CompanyData): Promise<void> {
  const { live, action } = await fixturesOf(world)
  const answers = [
    await data.read({ kind: 'TABLE', table: 'pedidos' }),
    await data.read({ kind: 'QUERY', sql: OUTSIDE_QUERY }),
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

async function callsNothingWithoutCatalog(world: DataWorld, data: CompanyData): Promise<void> {
  const { live, action } = await fixturesOf(world)
  world.down()
  const unavailable = { kind: 'CATALOG_UNAVAILABLE' }
  assert.deepEqual(await data.describe(), unavailable)
  assert.deepEqual(await data.read({ kind: 'OPERATION', ...live }), unavailable)
  assert.deepEqual(await data.read({ kind: 'TABLE', table: 'pedidos' }), unavailable)
  assert.deepEqual(await data.read({ kind: 'QUERY', sql: OUTSIDE_QUERY }), unavailable)
  assert.deepEqual(await data.act({ ...action, input: {}, call: CALL }), unavailable)
  reachedNothing(world)
}

async function passesTheSignalToEverySource(world: DataWorld, data: CompanyData): Promise<void> {
  const { live, action } = await fixturesOf(world)
  const { signal } = new AbortController()
  const before = world.reached.signals.length
  await data.describe({ signal })
  await data.read({ kind: 'OPERATION', ...live, signal })
  await data.read({ kind: 'QUERY', sql: OUTSIDE_QUERY, signal })
  await data.act({ ...action, input: {}, call: CALL, signal })
  const passed = world.reached.signals.slice(before)
  assert.equal(passed.length, 6, 'the catalog four times, the live read and the funnel')
  assert.ok(passed.every((one) => one === signal))
}

const LAWS: readonly (readonly [string, Law])[] = [
  ['descreve os sistemas, cada um com as suas leituras', describesSystems],
  ['lê ao vivo, com a hora, a entrada pedida e o valor do sistema', readsLive],
  [
    'recusa, sem chamar nada, a tabela, a consulta, a leitura fora do catálogo e a ação lida como leitura',
    refusesReadOutsideCatalog,
  ],
  [
    'age só pelo funil, uma vez, com o pedido e a chamada intactos, e devolve a resposta do funil',
    actsThroughTheFunnel,
  ],
  [
    'recusa, sem passar pelo funil, a ação fora do catálogo e a leitura pedida como ação',
    refusesActOutsideCatalog,
  ],
  ['sem catálogo, nenhum verbo chama o sistema ou o funil', callsNothingWithoutCatalog],
  ['passa o sinal de cancelamento a cada fonte que chama', passesTheSignalToEverySource],
  ...recordLaws,
]

export const DATA_LAWS: readonly string[] = LAWS.map(([law]) => law)

/** What every implementation of the data track's sources passes, against a fake connector or the real database; the world is made for each law. */
export function runDataConformance(
  name: string,
  make: (t: TestContext) => DataWorld | Promise<DataWorld>,
): void {
  // Each law keeps the runner's deadline; the suite, which runs them all, has none of its own.
  describe(name, { timeout: Number.POSITIVE_INFINITY }, () => {
    for (const [law, run] of LAWS)
      it(law, async (t) => {
        const world = await make(t)
        await run(world, world.data ?? companyData({ sources: world.sources, now: () => LAWS_AT }))
      })
  })
}
