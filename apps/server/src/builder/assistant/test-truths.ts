import { MERCADO_LIVRE_FACTS } from '../../hub/connectors/test-connections.ts'
import type { SalesSet } from '../../hub/connectors/test-sales.ts'
import {
  PADARIA_SOL_FILIAL,
  PADARIA_SOL_MATRIZ,
  salesDatabase,
  soldBy,
} from '../../hub/connectors/test-sales.ts'
import { shownIn } from './test-numbers.ts'

/**
 * What an answer must hold to be right: the column "Certo quando" of the card, as the doubles'
 * own data gives it. Every field is optional; an answer is right when it meets all that are set.
 */
export type Expected = {
  /** Figures the answer must show, each at the places the double gives it. */
  figures?: number[]
  /** Figures of which the answer must show at least one (the double has two honest readings). */
  anyFigure?: number[]
  /** Names the answer must say; in the order of the list when `ordered`. */
  names?: string[]
  ordered?: true
  /** Names the answer must not say: what "nenhum a mais" rules out. */
  forbidden?: string[]
  /** The answer must match at least one. */
  anyOf?: RegExp[]
  /** The answer lists exactly this many points. */
  points?: number
}

const SEPTEMBER = '2026-09'
/** "Nenhum", as an answer says it. */
const NONE = /nenhum|n[ãa]o (?:h[áa]|tem|temos|existe|encontr)/i

/** A name as an answer may write it: no accent, no case, no unit ("KG", "250G", "1L"). */
export function keyOf(name: string): string {
  return name
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/\b\d*(?:kg|g|l)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function cents(value: number): number {
  return Math.round(value * 100) / 100
}

const SETS: readonly SalesSet[] = [PADARIA_SOL_MATRIZ, PADARIA_SOL_FILIAL]

/** The September notes of the sets, each with its total and its seller's, customer's and products' names. */
function septemberNotes(sets: readonly SalesSet[]) {
  return sets.flatMap((set) =>
    set.notas
      .filter((nota) => nota.dtneg.startsWith(SEPTEMBER))
      .map((nota) => ({
        day: Number(nota.dtneg.slice(8, 10)),
        total: nota.itens.reduce((sum, item) => sum + item.vlrtot, 0),
        items: nota.itens.length,
        seller: set.vendedores.find((each) => each.codvend === nota.codvend)?.apelido ?? '',
        customer: set.parceiros.find((each) => each.codparc === nota.codparc)?.nomeparc ?? '',
        lines: nota.itens.map((item) => ({
          product: set.produtos.find((each) => each.codprod === item.codprod)?.descrprod ?? '',
          total: item.vlrtot,
        })),
      })),
  )
}

function grouped<T>(rows: readonly T[], by: (row: T) => string, of: (row: T) => number) {
  const sums = new Map<string, number>()
  for (const row of rows) sums.set(by(row), cents((sums.get(by(row)) ?? 0) + of(row)))
  return [...sums.entries()].sort((a, b) => b[1] - a[1])
}

function sum(values: readonly number[]): number {
  return cents(values.reduce((all, each) => all + each, 0))
}

/** A read of the double's register, in the SQL its SQLite runs: the rows, or a failure of the test. */
function registerRows(sql: string): unknown[][] {
  const answer = salesDatabase(PADARIA_SOL_MATRIZ)(sql)
  if (answer === undefined) throw new Error(`The double does not run: ${sql}`)
  return answer.rows
}

function sales(n: number): Expected | undefined {
  const all = septemberNotes(SETS)
  const filial = septemberNotes([PADARIA_SOL_FILIAL])
  const bySeller = grouped(
    all,
    (nota) => nota.seller,
    (nota) => nota.total,
  )
  const byFilial = grouped(
    filial,
    (nota) => nota.seller,
    (nota) => nota.total,
  )
  const byProduct = grouped(
    all.flatMap((nota) => nota.lines),
    (line) => line.product,
    (line) => line.total,
  )
  const byCustomer = grouped(
    all,
    (nota) => nota.customer,
    (nota) => nota.total,
  )
  const first = sum(all.filter((nota) => nota.day <= 15).map((nota) => nota.total))
  const second = sum(all.filter((nota) => nota.day > 15).map((nota) => nota.total))
  const totals = SETS.map((set) => sum([...soldBy(set, SEPTEMBER).values()]))
  const month = sum(all.map((nota) => nota.total))
  switch (n) {
    case 1:
      return { figures: bySeller.map(([, total]) => total), names: bySeller.map(([name]) => name) }
    case 2:
      return { names: [byFilial[0]?.[0] ?? ''], figures: [byFilial[0]?.[1] ?? 0] }
    case 3:
      return { figures: [...totals, cents(Math.abs((totals[0] ?? 0) - (totals[1] ?? 0)))] }
    case 4:
      return { names: byProduct.map(([name]) => name), ordered: true }
    case 5:
      return { names: [byCustomer[0]?.[0] ?? ''], figures: [byCustomer[0]?.[1] ?? 0] }
    case 6:
      return {
        figures: [first, second],
        anyOf: [first > second ? /primeira/i : /segunda/i],
      }
    case 7:
      return { figures: [cents(month / all.length)] }
    case 8:
      return { figures: [all.length, sum(all.map((nota) => nota.items)) / all.length] }
    default:
      return undefined
  }
}

function register(n: number): Expected | undefined {
  const owned = `from TGFPRO p where exists (select 1 from TGFEST e where e.CODPROD = p.CODPROD)`
  switch (n) {
    case 9: {
      const empty = registerRows(
        `select p.DESCRPROD ${owned} and not exists (select 1 from TGFEST e where e.CODPROD = p.CODPROD and e.TIPO = 'P' and e.ESTOQUE > 0)`,
      )
      const stocked = registerRows(
        `select p.DESCRPROD ${owned} and exists (select 1 from TGFEST e where e.CODPROD = p.CODPROD and e.TIPO = 'P' and e.ESTOQUE > 0)`,
      )
      return {
        names: empty.map(([name]) => String(name)),
        forbidden: stocked.map(([name]) => String(name)),
      }
    }
    case 10: {
      const groups = registerRows(
        `select g.DESCRGRUPOPROD, sum(e.ESTOQUE) from TGFGRU g join TGFPRO p on p.CODGRUPOPROD = g.CODGRUPOPROD join TGFEST e on e.CODPROD = p.CODPROD group by g.DESCRGRUPOPROD`,
      )
      return { figures: groups.map(([, total]) => Number(total)) }
    }
    case 11: {
      const over = registerRows(
        `select p.DESCRPROD from TGFEST e join TGFPRO p on p.CODPROD = e.CODPROD where e.RESERVADO > e.ESTOQUE`,
      )
      return over.length === 0 ? { anyOf: [NONE] } : { names: over.map(([name]) => String(name)) }
    }
    default:
      return undefined
  }
}

function mercadoLivre(n: number): Expected | undefined {
  const facts = MERCADO_LIVRE_FACTS
  switch (n) {
    case 12:
      return { figures: [facts.activeListings] }
    case 13:
      // Every shipment the double has is delivered: no sale waits to be shipped.
      return { anyOf: [NONE] }
    case 14:
      return { figures: [facts.unansweredQuestions] }
    case 15:
      return { anyOf: [new RegExp(`${facts.claimReason}|n[ãa]o receb|n[ãa]o entreg`, 'i')] }
    case 16:
      return { anyFigure: [facts.lastPeriodAmount, facts.periodDetailsAmount] }
    case 17:
      // The double gives one total of visits and none by listing.
      return { figures: [facts.totalVisits] }
    case 18:
      // The one promotion is a candidate that starts on 1 October: none runs now.
      return { anyOf: [NONE, /candidat/i] }
    default:
      return undefined
  }
}

/** A goals sheet of 3 columns and 200 rows, as the test generates it (invented names). */
export function goalsSheet(): string {
  const sellers = ['JOAO', 'MARIA', 'PEDRO', 'LUCIA']
  const rows = Array.from({ length: 200 }, (_, at) => {
    const seller = sellers[at % sellers.length] ?? 'JOAO'
    return `${seller},${String(1 + (at % 12)).padStart(2, '0')}/2026,${1000 + (at % 7) * 100}`
  })
  return ['vendedor,mes,meta', ...rows].join('\n')
}

/** The goals sheet's sum of `meta` by seller in a month (`MM/2026`), as the test generates the sheet. */
function goals(month: string): [string, number][] {
  const sums = new Map<string, number>()
  for (const line of goalsSheet().split('\n').slice(1)) {
    const [seller = '', on = '', meta = '0'] = line.split(',')
    if (month === 'all' || on.startsWith(month))
      sums.set(seller, (sums.get(seller) ?? 0) + Number(meta))
  }
  return [...sums.entries()]
}

function files(n: number): Expected | undefined {
  switch (n) {
    case 19:
      return { points: 5 }
    case 20:
      return {
        figures: goals('all').map(([, total]) => total),
        names: goals('all').map(([name]) => name),
      }
    case 21: {
      const sold = new Map(
        grouped(
          septemberNotes(SETS),
          (nota) => nota.seller,
          (nota) => nota.total,
        ),
      )
      const hit = goals('09').filter(([seller, meta]) => (sold.get(seller) ?? 0) >= meta)
      return hit.length === 0 ? { anyOf: [NONE] } : { names: hit.map(([seller]) => seller) }
    }
    default:
      return undefined
  }
}

/** What question `n` of the scorecard must be answered with, or `undefined` when it asks only for what it says or leaves unsaid. */
export function expectedOf(n: number): Expected | undefined {
  return sales(n) ?? register(n) ?? mercadoLivre(n) ?? files(n)
}

/** Whether `text` shows `value`: at two decimals when it has them, whole otherwise, in the Brazilian way or the plain one. */
export function shows(text: string, value: number): boolean {
  const fraction = !Number.isInteger(value)
  return shownIn(text).some((shown) => {
    const shownValue = shown.value * shown.scale
    return fraction
      ? shown.places >= 2 && Math.abs(shownValue - value) < 0.005
      : Math.abs(shownValue - value) < 1e-9
  })
}

/** Whether the answer meets every part of what it must hold. */
export function meets(text: string, expected: Expected): boolean {
  const plain = keyOf(text)
  const names = expected.names ?? []
  const places = names.map((name) => plain.indexOf(keyOf(name)))
  const ordered =
    expected.ordered === undefined ||
    places.every((place, i) => i === 0 || place > (places[i - 1] ?? 0))
  return (
    (expected.figures ?? []).every((value) => shows(text, value)) &&
    (expected.anyFigure === undefined || expected.anyFigure.some((value) => shows(text, value))) &&
    places.every((place) => place >= 0) &&
    ordered &&
    (expected.forbidden ?? []).every((name) => !plain.includes(keyOf(name))) &&
    (expected.anyOf === undefined || expected.anyOf.some((pattern) => pattern.test(text))) &&
    (expected.points === undefined ||
      text.split('\n').filter((line) => /^\s*(?:[-*•]|\d+[.)])\s+/.test(line)).length ===
        expected.points)
  )
}
