import assert from 'node:assert/strict'
import type { CompanyData, ReadRequest } from './company-data.ts'
import { ReadAnswer } from './company-data.ts'
import { fixturesOf } from './company-data-fixtures.ts'
import type { DataWorld } from './company-data-world.ts'

type Law = (world: DataWorld, data: CompanyData) => Promise<void>

/** The strings of a value, at any depth: a read's cells, or a row's fields. */
function stringsOf(value: unknown): string[] {
  if (typeof value === 'string') return [value]
  if (value === null || typeof value !== 'object') return []
  return Object.values(value).flatMap(stringsOf)
}

function broughtOf(answer: ReadAnswer): unknown {
  switch (answer.kind) {
    case 'TABLE':
    case 'QUERY':
      return answer.rows
    case 'LIVE':
      return answer.value
    default:
      return null
  }
}

async function readsAsked(world: DataWorld): Promise<ReadRequest[]> {
  const { copied, live, query } = await fixturesOf(world)
  return [
    { kind: 'TABLE', table: query.name },
    { kind: 'OPERATION', ...copied },
    { kind: 'OPERATION', ...live },
    { kind: 'QUERY', sql: world.queries.reads },
    { kind: 'QUERY', sql: world.queries.refused },
    { kind: 'TABLE', table: world.hidden.table },
  ]
}

/** A string shorter than this could sit in a row's names or counts by chance. */
const CELL_MIN = 4

export async function recordsEveryReadOnce(world: DataWorld, data: CompanyData): Promise<void> {
  const asked = await readsAsked(world)
  const before = (await world.reads()).length
  await data.describe()
  assert.equal((await world.reads()).length, before, 'describe leaves no row')
  const named = new Set(stringsOf(asked))
  let looked = 0
  for (const request of asked) {
    const was = (await world.reads()).length
    const answer = ReadAnswer.parse(await data.read(request))
    const rows = await world.reads()
    assert.equal(rows.length, was + 1, `${request.kind} answered ${answer.kind}: one row`)
    const record = JSON.stringify(rows)
    const cells = stringsOf(broughtOf(answer)).filter(
      (cell) => cell.length >= CELL_MIN && !named.has(cell),
    )
    looked += cells.length
    for (const cell of cells)
      assert.ok(
        !record.includes(JSON.stringify(cell).slice(1, -1)),
        `a row holds the value ${cell}`,
      )
  }
  assert.ok(looked > 0, 'the reads brought a value to look for')
}

export async function returnsNothingUnrecorded(world: DataWorld, data: CompanyData): Promise<void> {
  const asked = await readsAsked(world)
  await world.failRecord()
  for (const request of asked) {
    const answer = ReadAnswer.parse(await data.read(request))
    assert.equal(broughtOf(answer), null, JSON.stringify(answer))
  }
}

/** The laws of the record of reads, in the order they run inside the contract's laws. */
export const recordLaws: readonly (readonly [string, Law])[] = [
  ['toda leitura deixa exatamente uma linha, sem nenhuma célula', recordsEveryReadOnce],
  ['a gravação derrubada não devolve linha', returnsNothingUnrecorded],
]
