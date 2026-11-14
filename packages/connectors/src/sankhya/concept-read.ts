import { z } from 'zod'
import type {
  ConceptCall,
  ConceptColumn,
  ConceptFilter,
  ConceptMeasure,
  ConceptRead,
} from '../kernel/concepts.ts'
import { ConceptRefused } from '../kernel/concepts.ts'
import { dated } from './copy-read.ts'
import { isOneReadStatement } from './read-only-sql.ts'
import {
  CodeText,
  containing,
  exact,
  flag,
  inExact,
  inList,
  pageSql,
  SearchText,
} from './search-sql.ts'

/*
 * A concept's read on Sankhya: the proved query enters as `(<sql>) Q`, and what the agent asks
 * enters only through the kit's literals (`search-sql.ts`), each value checked against its column's
 * type first. Every statement is judged by `isOneReadStatement` before it leaves; the door judges it
 * again.
 */

const COLUMN = /^[A-Za-z_][A-Za-z0-9_]{0,127}$/
const NUMERIC = new Set<ConceptColumn['type']>(['INTEGER', 'DECIMAL', 'MONEY'])
const DATED = new Set<ConceptColumn['type']>(['DATE', 'TIMESTAMP'])
const IN_MAX = 50
const GROUPS_MAX = 2

function refuse(why: string): never {
  throw new ConceptRefused(why)
}

function checked(statement: string): string {
  return isOneReadStatement(statement) ? statement : refuse('not one read statement')
}

/** A column of a read: a plain name, quoted when it is not upper case (the pattern has no quote). */
function named(column: string, of = 'Q'): string {
  if (!COLUMN.test(column)) refuse(`column ${column}`)
  return /^[A-Z][A-Z0-9_]*$/.test(column) ? `${of}.${column}` : `${of}."${column}"`
}

function numberOf(value: unknown, type: ConceptColumn['type']): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return refuse('not a number')
  if ((type === 'INTEGER' || type === 'ID') && !Number.isInteger(value))
    return refuse('not an integer')
  return String(value)
}

const Day = z.iso.date()

function dayOf(value: unknown): string {
  const day = Day.safeParse(value)
  return day.success ? dated(day.data) : refuse('not a date')
}

/** One value of a column as the literal its type takes: a number, an exact code, a date or a flag. */
function literal(value: unknown, type: ConceptColumn['type']): string {
  if (NUMERIC.has(type)) return numberOf(value, type)
  if (DATED.has(type)) return dayOf(value)
  if (type === 'BOOLEAN')
    return typeof value === 'boolean' ? (value ? "'S'" : "'N'") : refuse('not a flag')
  if (typeof value === 'number') return numberOf(value, type)
  if (typeof value !== 'string' || !CodeText.safeParse(value).success) return refuse('not a code')
  return exact(value)
}

function conditionOf(filter: ConceptFilter, column: ConceptColumn): string {
  const at = named(column.column)
  switch (filter.op) {
    case 'equals':
      if (column.type === 'BOOLEAN' && typeof filter.value === 'boolean')
        return flag(at, filter.value)
      return `${at} = ${literal(filter.value, column.type)}`
    case 'in': {
      const { values } = filter
      if (values.length === 0 || values.length > IN_MAX) return refuse('in: 1 to 50 values')
      if (DATED.has(column.type) || column.type === 'BOOLEAN') return refuse('in on a date or flag')
      if (values.every((value) => typeof value === 'number'))
        return inList(
          at,
          values.map((value) => Number(numberOf(value, column.type))),
        )
      if (NUMERIC.has(column.type) || !values.every((value) => typeof value === 'string'))
        return refuse('in: one type of value')
      const codes = values.filter((value): value is string => typeof value === 'string')
      if (!codes.every((code) => CodeText.safeParse(code).success)) return refuse('not a code')
      return inExact(at, codes)
    }
    case 'from':
    case 'to': {
      if (!NUMERIC.has(column.type) && !DATED.has(column.type)) return refuse('range on a code')
      return `${at} ${filter.op === 'from' ? '>=' : '<='} ${literal(filter.value, column.type)}`
    }
    case 'contains': {
      if (column.type !== 'TEXT') return refuse('contains on a column that is not text')
      const text = SearchText.safeParse(filter.text)
      return text.success ? containing([at], text.data) : refuse('not a search text')
    }
    default:
      return filter satisfies never
  }
}

function columnIn(call: ConceptCall, column: string): ConceptColumn {
  return call.columns.find((each) => each.column === column) ?? refuse(`not a field: ${column}`)
}

function aggregated(call: ConceptCall, measure: ConceptMeasure, where: readonly string[]): string {
  if (measure.groupBy.length > GROUPS_MAX) refuse('groupBy: at most 2')
  const groups = measure.groupBy.map((column) => {
    const found = columnIn(call, column)
    return found.type === 'ID' || found.type === 'CODE' ? named(column) : refuse('groupBy a value')
  })
  const sums = measure.sum.map((column) => {
    const found = columnIn(call, column)
    if (!NUMERIC.has(found.type)) refuse('sum of a column that is not a number')
    return `SUM(${named(column)}) AS "sum_${column}"`
  })
  const counted = measure.count ? ['COUNT(*) AS "count"'] : []
  if (counted.length + sums.length === 0) refuse('a measure with nothing to measure')
  const filter = where.length === 0 ? '' : ` WHERE ${where.join(' AND ')}`
  const grouped = groups.length === 0 ? '' : ` GROUP BY ${groups.join(', ')}`
  const inner = `SELECT ${[...groups, ...counted, ...sums].join(', ')} FROM (${call.sql}) Q${filter}${grouped}`
  const outer = measure.groupBy.map((column) => named(column, 'M'))
  const first = measure.count ? 'M."count"' : `M."sum_${measure.sum[0]}"`
  return pageSql({
    select: ['M.*'],
    from: `(${inner}) M`,
    where: [],
    order: (outer.length === 0 ? [first] : outer).join(', '),
    limit: call.limit,
  })
}

function compile(call: ConceptCall): string {
  if (!Number.isInteger(call.limit) || call.limit < 1 || call.limit > 100) refuse('limit: 1 to 100')
  if (!isOneReadStatement(call.sql)) refuse('the proved query is not one read statement')
  const where = call.filters.map((filter) => conditionOf(filter, columnIn(call, filter.column)))
  if (call.measure !== undefined) return checked(aggregated(call, call.measure, where))
  if (call.order.length === 0) refuse('no key to order by')
  return checked(
    pageSql({
      select: call.select.map((column) => named(columnIn(call, column).column)),
      from: `(${call.sql}) Q`,
      where,
      order: call.order.map((column) => named(columnIn(call, column).column)).join(', '),
      limit: call.limit,
    }),
  )
}

function subset(role: string, base: string, keys: readonly (readonly [string, string])[]): string {
  if (keys.length === 0 || keys.length > 4) refuse('subset: 1 to 4 key pairs')
  const pairs = keys.map(([of, to]) => `${named(to, 'B')} = ${named(of, 'R')}`).join(' AND ')
  return checked(
    `SELECT COUNT(*) AS N FROM (${role}) R WHERE NOT EXISTS (SELECT 1 FROM (${base}) B WHERE ${pairs})`,
  )
}

export const sankhyaConceptRead: ConceptRead = Object.freeze({
  door: 'consultar',
  count: (sql: string) => checked(`SELECT COUNT(*) AS N FROM (${sql}) Q`),
  shape: (sql: string) => checked(`SELECT * FROM (${sql}) Q OFFSET 0 ROWS FETCH NEXT 1 ROWS ONLY`),
  subset,
  compile,
})
