import { z } from 'zod'
import type { TableColumnType } from './tables.ts'

export const LAKE_NAME_PATTERN = /^[a-z][a-z0-9_]{0,59}$/

export const LakeTableName = z.string().regex(LAKE_NAME_PATTERN).brand('LakeTableName')
export type LakeTableName = z.infer<typeof LakeTableName>

export type TreatedCast = 'KEEP' | 'TEXT' | 'INTEGER' | 'DATE' | 'TIMESTAMP'

export type TreatedColumn = Readonly<{
  column: string
  as: string
  cast: TreatedCast
}>

export type TreatedTable = Readonly<{ description: string; columns: readonly TreatedColumn[] }>

// an Iceberg table takes a timestamp at the microsecond only
const SQL_TYPES: Readonly<Record<Exclude<TreatedCast, 'KEEP'>, string>> = {
  TEXT: 'VARCHAR',
  INTEGER: 'INTEGER',
  DATE: 'DATE',
  TIMESTAMP: 'TIMESTAMP(6)',
}

/** What a copied column's type is called on screen: the one vocabulary, in Portuguese (the founder, 2026-11-26). */
const TYPE_WORDS = {
  text: 'texto',
  numeric: 'número',
  bigint: 'número',
  date: 'data',
  timestamp: 'data e hora',
  boolean: 'verdadeiro ou falso',
  json: 'JSON',
  binary: 'binário',
} as const satisfies Record<TableColumnType, string>

const COPIED_WORDS: ReadonlyMap<string, string> = new Map(Object.entries(TYPE_WORDS))

/** The type each cast gives, in the copied columns' own names; the SELECT keeps `SQL_TYPES`. */
const CAST_TYPES = {
  TEXT: 'text',
  INTEGER: 'bigint',
  DATE: 'date',
  TIMESTAMP: 'timestamp',
} as const satisfies Record<Exclude<TreatedCast, 'KEEP'>, TableColumnType>

/** The type a treated column shows, in words: the copied column's when the cast keeps it, the cast's otherwise; null while the copied one is not known. */
export function treatedColumnType(cast: TreatedCast, copiedType: string | null): string | null {
  if (cast !== 'KEEP') return TYPE_WORDS[CAST_TYPES[cast]]
  return copiedType === null ? null : (COPIED_WORDS.get(copiedType) ?? null)
}

/** The one owner of a treated table's SELECT: it reads "current"."<name>", with no filter and no join. */
export function treatedSelect(lakeName: LakeTableName, treated: TreatedTable): string {
  const columns = treated.columns.map(({ column, as, cast }) => {
    const read = cast === 'KEEP' ? `"${column}"` : `CAST("${column}" AS ${SQL_TYPES[cast]})`
    return `  ${read} AS "${as}"`
  })
  return `SELECT\n${columns.join(',\n')}\nFROM "current"."${lakeName}"`
}
