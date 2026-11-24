import type { DataReadEntry } from '@conexus/hub-api'
import { DataReadEntry as Entry } from '@conexus/hub-api'
import { expect, test } from 'vitest'
import type { z } from 'zod'
import { readsCsv } from './csv.ts'

/** Bruno's query through the Assistant in Início, as the Hub answers it. */
function read(fields: Partial<z.input<typeof Entry>>): DataReadEntry {
  return Entry.parse({
    ...{ id: crypto.randomUUID(), at: '2026-11-21T13:02:00.000Z', agent: 'ASSISTANT' },
    ...{ person: { id: 'person-bruno', name: 'Bruno Reis' }, project: null, agentId: null },
    ...{ threadId: null, verb: 'QUERY', tables: ['sankhya_vendas'], connection: null },
    ...{ operation: null, query: null, outcome: 'QUERY', rows: 1, ms: 12 },
    ...fields,
  })
}

const NAMES = { agent: () => undefined, connection: () => undefined }

function cellsOf(text: string) {
  return text.replace(/^﻿/, '').split('\r\n')
}

test('o CSV desarma fórmula', () => {
  const formulas = ['=HYPERLINK("x")', '+1', '-1', '@SUM(A1)']
  const text = readsCsv(
    formulas.map((query) => read({ verb: 'QUERY', tables: [], query, outcome: 'QUERY' })),
    NAMES,
  )
  const lines = cellsOf(text)
  expect(lines[0]).toBe(
    'Quando,Quem,Agente,Onde,O que foi lido,Resultado,Código,Linhas,Tempo (ms),Consulta',
  )
  expect(lines.slice(1, 5).map((line) => line.slice(line.lastIndexOf(',') + 1))).toEqual([
    `"'=HYPERLINK(""x"")"`,
    "'+1",
    "'-1",
    "'@SUM(A1)",
  ])
  expect(text.startsWith('﻿')).toBe(true)
})

test('o CSV põe entre aspas a célula com vírgula, aspas ou quebra de linha', () => {
  const query = 'select a,\n"b" from sync.sankhya_vendas'
  const text = readsCsv([read({ verb: 'QUERY', query, outcome: 'QUERY' })], NAMES)
  expect(text).toContain(
    `Bruno Reis,Conexus em Conversas,no Início,sankhya_vendas,Lida,QUERY,1,12,"select a,\n""b"" from sync.sankhya_vendas"\r\n`,
  )
})

test('o CSV dá a hora no fuso de quem olha, com o deslocamento (fundador, "2. A")', () => {
  // The tests run in America/Sao_Paulo (vitest.config.ts): 13:02 UTC is 10:02 there.
  const text = readsCsv([read({ at: '2026-11-21T13:02:00.000Z' })], NAMES)
  expect(cellsOf(text)[1]?.split(',')[0]).toBe('2026-11-21T10:02:00-03:00')
})
