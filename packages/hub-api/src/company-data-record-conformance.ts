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

async function recordsEveryReadOnce(world: DataWorld, data: CompanyData): Promise<void> {
  const asked = await readsAsked(world)
  const before = (await world.reads()).length
  await data.describe()
  assert.equal((await world.reads()).length, before, 'describe leaves no row')
  const answers: ReadAnswer[] = []
  for (const request of asked) answers.push(ReadAnswer.parse(await data.read(request)))
  const rows = (await world.reads()).slice(before)
  assert.equal(rows.length, asked.length, 'exactly one row per read')
  const named = new Set(stringsOf(asked))
  const cells = new Set(answers.flatMap((answer) => stringsOf(broughtOf(answer))))
  const read = [...cells].filter((cell) => !named.has(cell))
  assert.ok(read.length > 0, 'the reads brought a value to look for')
  for (const row of rows)
    for (const field of stringsOf(row))
      assert.ok(!read.includes(field), `a row holds the value ${field}`)
}

async function returnsNothingUnrecorded(world: DataWorld, data: CompanyData): Promise<void> {
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
