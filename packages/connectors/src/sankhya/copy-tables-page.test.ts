import assert from 'node:assert/strict'
import { test } from 'node:test'
import { z } from 'zod'
import type { TableColumn, TableDeclaration } from '../index.ts'
import { discoverTables, readTablePage, sankhyaFake } from '../index.ts'
import { sendTo, tableReachOf, walkTable } from '../kernel/conformance-tables.ts'
import { defineConnector } from '../kernel/definition.ts'
import { sankhya } from './definition.ts'

function tableOf(name: string): TableDeclaration {
  return sankhya.tables?.declared.find((table) => table.name === name) ?? assert.fail(name)
}

async function columnsOf(name: string): Promise<readonly TableColumn[]> {
  const found = await discoverTables(await tableReachOf(sankhya, sankhyaFake()))
  return found.find(({ declaration }) => declaration.name === name)?.columns ?? assert.fail(name)
}

const GATEWAY_BYTES = 262_144

test('a página é limitada por bytes desde a primeira: a tabela larga lê inteira onde o gateway recusa a resposta grande, e a estreita cresce', async () => {
  const fake = sankhyaFake()
  const reach = await tableReachOf(sankhya, fake)
  const asked: number[] = []
  const send = sendTo(sankhya, fake)
  const gateway: typeof send = async (request, a) => {
    const { sql } = z
      .object({ requestBody: z.object({ sql: z.string() }) })
      .parse(request.body).requestBody
    asked.push(Number(/FETCH NEXT (\d+) ROWS ONLY$/.exec(sql)?.[1]))
    const answer = await send(request, a)
    if ('status' in answer && JSON.stringify(answer.body).length > GATEWAY_BYTES)
      return { status: 500, body: { message: 'Internal Server Error' } }
    return answer
  }
  const tables = sankhya.tables ?? assert.fail()
  const readTable = tables.readTable ?? assert.fail()
  const connector = defineConnector({
    ...sankhya,
    tables: { ...tables, readTable: { ...readTable, page: { rows: 5000, bytes: 131_072 } } },
  })
  const through = { ...reach, connector, send: gateway }
  const wide = await columnsOf('notas')

  const whole = await readTablePage({
    ...through,
    table: tableOf('notas'),
    columns: wide,
    filter: { kind: 'ALL' },
    after: { kind: 'KEY', after: ['100000'], rows: 5000 },
  })
  assert.partialDeepStrictEqual(whole, {
    kind: 'FAILED',
    code: 'COPY_SOURCE_UNREACHABLE',
    system: { status: 500 },
  })

  asked.length = 0
  const notes = await walkTable(through, tableOf('notas'), { kind: 'ALL' }, wide)
  assert.equal(notes.length, 184, 'a tabela larga lê inteira, sem 5xx')
  assert.equal(asked[0], 10, 'a primeira página pede poucas linhas, não as 5.000')
  assert.ok(
    asked.every((rows) => rows < 100),
    `a página larga fica abaixo do que o gateway aceita: ${asked}`,
  )

  asked.length = 0
  const items = await walkTable(
    through,
    tableOf('notas_itens'),
    { kind: 'ALL' },
    await columnsOf('notas_itens'),
  )
  assert.equal(items.length, 366, 'a tabela estreita lê inteira')
  assert.deepEqual(asked.slice(0, 2), [10, 100], 'a página estreita cresce até dez vezes por passo')
})
