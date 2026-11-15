import assert from 'node:assert/strict'
import type { CompanyData } from './company-data.ts'
import { Described } from './company-data.ts'
import type { DataWorld } from './company-data-world.ts'

type Law = (world: DataWorld, data: CompanyData) => Promise<void>

async function keepsWithheldTableOut(world: DataWorld, data: CompanyData): Promise<void> {
  const { table } = world.withheld
  const described = Described.parse(await world.sources.catalog({}))
  assert.equal(described.kind, 'CATALOG')
  const { tables, withheld } = described
  assert.ok(
    withheld.some(({ name }) => name === table),
    'the catalog lists the withheld table by name',
  )
  assert.ok(withheld.every(({ name }) => tables.every((one) => one.name !== name)))
  const answer = await data.read({ kind: 'TABLE', table })
  assert.deepEqual(answer, { kind: 'NOT_IN_ROLE' })
  assert.deepEqual(world.reached.rows, [])
}

async function returnsNoRowsWhenTheDatabaseRefusesForRole(
  world: DataWorld,
  data: CompanyData,
): Promise<void> {
  const answer = await data.read({ kind: 'QUERY', sql: world.withheld.query })
  assert.deepEqual(answer, { kind: 'NOT_IN_ROLE' })
  assert.equal(Object.hasOwn(answer, 'rows'), false)
}

/** The laws of the table the asker's role does not read, in the order they run inside the contract's laws. */
export const roleLaws: readonly (readonly [string, Law])[] = [
  [
    'uma tabela retida nunca aparece em tables e a leitura dela responde NOT_IN_ROLE sem pedir linhas',
    keepsWithheldTableOut,
  ],
  [
    'uma consulta que o banco recusa por permissão responde NOT_IN_ROLE e não devolve linha',
    returnsNoRowsWhenTheDatabaseRefusesForRole,
  ],
]
