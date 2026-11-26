import { z } from 'zod'

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

/** The type a treated column has: the Athena type its cast gives, or the copied column's own when the cast keeps it (null while that one is not known). */
export function treatedColumnType(cast: TreatedCast, copiedType: string | null): string | null {
  return cast === 'KEEP' ? copiedType : SQL_TYPES[cast].toLowerCase()
}

/** The one owner of a treated table's SELECT: it reads "current"."<name>", with no filter and no join. */
export function treatedSelect(lakeName: LakeTableName, treated: TreatedTable): string {
  const columns = treated.columns.map(({ column, as, cast }) => {
    const read = cast === 'KEEP' ? `"${column}"` : `CAST("${column}" AS ${SQL_TYPES[cast]})`
    return `  ${read} AS "${as}"`
  })
  return `SELECT\n${columns.join(',\n')}\nFROM "current"."${lakeName}"`
}
