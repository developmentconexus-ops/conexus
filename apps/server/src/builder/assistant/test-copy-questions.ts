import { BUILDER_TOOL, DATA_TOOL, DataResult } from '@conexus/hub-api'
import type { MastraMessagePart } from '@mastra/core/agent-controller'
import { PADARIA_SOL_MATRIZ, salesDatabase, soldBy } from '../../hub/connectors/test-sales.ts'
import { TOTAL_OUTUBRO } from '../data-tools/test-data.ts'
import { textOf } from './test-real-model.ts'
import { failed, invocationsOf } from './test-scorecard.ts'
import { keyOf, shows } from './test-truths.ts'

/**
 * A question of the Sankhya data as the company's copies keep it. `asks` is who asks: the owner in
 * the Início (the Assistant) or the Builder in a Projeto. `tables` are the tables the answer's
 * origin must name; `truth` computes what the right answer holds from the Sankhya double itself,
 * and is null when the right answer holds no figure; `partial` runs on a copy whose last run
 * stopped halfway; `released` are the copies the Projeto was given.
 */
export type CopyQuestion = Readonly<{
  n: `c${1 | 2 | 3 | 4 | 5 | 6}`
  text: string
  asks: 'OWNER' | 'BUILDER'
  tables: readonly string[]
  truth: () => number | string | null
  partial?: true
  released?: readonly string[]
}>

const OCTOBER = '2026-10'

function activeClients(): number {
  const answer = salesDatabase(PADARIA_SOL_MATRIZ)(
    "SELECT COUNT(*) AS N FROM TGFPAR WHERE ATIVO = 'S' AND CLIENTE = 'S'",
  )
  const count = Number(answer?.rows[0]?.[0])
  if (!Number.isInteger(count)) throw new Error('The double did not count its clients.')
  return count
}

function topSeller(): string {
  const [first] = [...soldBy(PADARIA_SOL_MATRIZ, OCTOBER)].sort(([, a], [, b]) => b - a)
  if (first === undefined) throw new Error('The double sold nothing in October.')
  return first[0]
}

export const COPY_QUESTIONS: readonly CopyQuestion[] = [
  {
    n: 'c1',
    text: 'Quanto vendi em outubro?',
    asks: 'OWNER',
    tables: ['sankhya_vendas'],
    truth: () => TOTAL_OUTUBRO,
  },
  {
    n: 'c2',
    text: 'Quantos clientes ativos temos?',
    asks: 'OWNER',
    tables: ['sankhya_clientes'],
    truth: activeClients,
  },
  {
    n: 'c3',
    text: 'Qual vendedor mais vendeu no mês?',
    asks: 'OWNER',
    tables: ['sankhya_vendas', 'sankhya_vendedores'],
    truth: topSeller,
  },
  {
    n: 'c4',
    text: 'Quanto pagamos de comissão?',
    asks: 'OWNER',
    tables: [],
    truth: () => null,
  },
  {
    n: 'c5',
    text: 'Quanto vendi em outubro?',
    asks: 'OWNER',
    tables: ['sankhya_vendas'],
    truth: () => TOTAL_OUTUBRO,
    partial: true,
  },
  {
    n: 'c6',
    text: 'Quais tabelas de cliente eu tenho?',
    asks: 'BUILDER',
    tables: ['sankhya_clientes'],
    truth: () => 'sankhya_clientes',
    released: ['clientes'],
  },
]

const NOT_FOUND = /n[ãa]o (?:achei|encontrei)/i
const PARTIAL = /incomplet|parcial/i

function liveRead(name: string): boolean {
  return name === BUILDER_TOOL.connectorRead || name.startsWith('sankhya_')
}

/** The results the turn's data tools gave, in order; a result `DataResult` does not read is not one. */
function dataOf(parts: readonly MastraMessagePart[]) {
  return invocationsOf(parts).flatMap((call) => {
    if (call.state !== 'result') return []
    const read = DataResult.safeParse(call.result)
    return read.success ? [{ tool: call.toolName, result: read.data }] : []
  })
}

/**
 * Whether the turn answered a copy question right: no call failed, nothing was read live, and, by
 * question, the tables in the origin of its last `data_query`, the figure or name it shows, the
 * word of warning on a partial copy, or, for the question the data cannot answer, that it says so,
 * names a table that exists and shows no figure.
 */
export function judgedCopy(asked: CopyQuestion, parts: readonly MastraMessagePart[]): boolean {
  const calls = invocationsOf(parts)
  if (calls.some(failed) || calls.some((call) => liveRead(call.toolName))) return false
  const text = textOf([...parts])
  const results = dataOf(parts)
  const tablesListed = results.flatMap(({ result }) =>
    result.kind === 'CATALOG' ? result.tables.map((each) => each.name) : [],
  )
  if (asked.n === 'c4')
    return (
      NOT_FOUND.test(text) && !/\d/.test(text) && tablesListed.some((name) => text.includes(name))
    )
  if (asked.n === 'c6') {
    const named = text.match(/sankhya_[a-z_]+/g) ?? []
    return named.length > 0 && named.every((name) => name === 'sankhya_clientes')
  }
  const last = results.findLast(({ tool }) => tool === DATA_TOOL.query)?.result
  if (last?.kind !== 'ROWS') return false
  const origin = last.origin.map((each) => each.table).sort()
  if (origin.join() !== [...asked.tables].sort().join()) return false
  const truth = asked.truth()
  const states =
    typeof truth === 'number'
      ? shows(text, truth)
      : truth !== null && keyOf(text).includes(keyOf(truth))
  return states && (asked.partial !== true || PARTIAL.test(text))
}
