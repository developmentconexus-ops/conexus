import assert from 'node:assert/strict'
import type { CompanyData } from './company-data.ts'
import { Described } from './company-data.ts'
import type { DataWorld } from './company-data-world.ts'

type Law = (world: DataWorld, data: CompanyData) => Promise<void>

async function keepsHiddenTableOut(world: DataWorld, data: CompanyData): Promise<void> {
  const { table } = world.hidden
  const described = Described.parse(await world.sources.catalog({}))
  assert.equal(described.kind, 'CATALOG')
  assert.ok(!JSON.stringify(described).includes(table), 'the catalog names the hidden table')
  const answer = await data.read({ kind: 'TABLE', table })
  assert.deepEqual(answer, { kind: 'NOT_IN_CATALOG' })
  assert.deepEqual(world.reached.rows, [])
}

async function answersTheHiddenTableAsAbsentInAQuery(
  world: DataWorld,
  data: CompanyData,
): Promise<void> {
  const answer = await data.read({ kind: 'QUERY', sql: world.hidden.query })
  assert.deepEqual(answer, { kind: 'NOT_IN_CATALOG' })
  assert.equal(Object.hasOwn(answer, 'rows'), false)
}

/** The laws of the table the asker's role does not read, in the order they run inside the contract's laws. */
export const roleLaws: readonly (readonly [string, Law])[] = [
  [
    'uma tabela que o papel não lê não aparece no catálogo e pedir pelo nome responde NOT_IN_CATALOG sem pedir linhas',
    keepsHiddenTableOut,
  ],
  [
    'uma consulta que nomeia a tabela que o papel não lê responde NOT_IN_CATALOG e não devolve linha',
    answersTheHiddenTableAsAbsentInAQuery,
  ],
]
