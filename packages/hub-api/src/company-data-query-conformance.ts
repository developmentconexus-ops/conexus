import assert from 'node:assert/strict'
import type { CompanyData } from './company-data.ts'
import { Described, ReadAnswer } from './company-data.ts'
import type { DataWorld } from './company-data-world.ts'

type Law = (world: DataWorld, data: CompanyData) => Promise<void>

async function queriesTheCatalog(world: DataWorld, data: CompanyData): Promise<void> {
  const answer = ReadAnswer.parse(await data.read({ kind: 'QUERY', sql: world.queries.reads }))
  assert.equal(answer.kind, 'QUERY')
  assert.ok(answer.rows.length > 0)
  const described = Described.parse(await world.sources.catalog({}))
  assert.equal(described.kind, 'CATALOG')
  const { tables } = described
  for (const { table, kept } of answer.tables) {
    assert.deepEqual(kept, tables.find((one) => one.name === table)?.kept)
  }
  assert.deepEqual(world.reached.live, [])
}

async function refusesRowsOutsideCatalog(world: DataWorld, data: CompanyData): Promise<void> {
  const answer = await data.read({ kind: 'QUERY', sql: world.queries.outside })
  assert.deepEqual(answer, { kind: 'NOT_IN_CATALOG' })
}

async function keepsTheRefusalWhole(world: DataWorld, data: CompanyData): Promise<void> {
  const answer = ReadAnswer.parse(await data.read({ kind: 'QUERY', sql: world.queries.refused }))
  assert.equal(answer.kind, 'QUERY_REFUSED')
  assert.deepEqual([answer], world.gave.query.slice(-1))
  assert.deepEqual(world.reached.live, [])
}

async function queriesNothingWithoutCatalog(world: DataWorld, data: CompanyData): Promise<void> {
  world.down('catalog')
  const answer = await data.read({ kind: 'QUERY', sql: world.queries.reads })
  assert.deepEqual(answer, { kind: 'CATALOG_UNAVAILABLE' })
  assert.deepEqual(world.reached.query, [])
}

async function passesTheSignalToTheQuery(world: DataWorld, data: CompanyData): Promise<void> {
  const { signal } = new AbortController()
  const before = world.reached.signals.length
  await data.read({ kind: 'QUERY', sql: world.queries.reads, signal })
  const passed = world.reached.signals.slice(before)
  assert.equal(passed.length, 2, 'the catalog and the query')
  assert.ok(passed.every((one) => one === signal))
}

/** The laws of the query verb, in the order they run inside the contract's laws. */
export const queryLaws: readonly (readonly [string, Law])[] = [
  [
    'consulta as tabelas do catálogo e devolve cada tabela lida com quem a guarda',
    queriesTheCatalog,
  ],
  [
    'não devolve linha nenhuma de uma consulta que leu uma tabela fora do catálogo',
    refusesRowsOutsideCatalog,
  ],
  [
    'devolve inteira a recusa do banco, com o SQLSTATE, sem ler ao vivo no lugar',
    keepsTheRefusalWhole,
  ],
  ['sem catálogo, a consulta não chega ao banco', queriesNothingWithoutCatalog],
  ['passa o sinal de cancelamento à consulta', passesTheSignalToTheQuery],
]
