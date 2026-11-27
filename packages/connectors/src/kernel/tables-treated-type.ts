import type { TableColumnType } from './tables.ts'
import type { TreatedCast } from './tables-treated.ts'

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
