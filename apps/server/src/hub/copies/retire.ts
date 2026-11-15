import { CopyDefinitionV1 } from '@conexus/connectors'
import { eq } from 'drizzle-orm'
import type { DatabaseUrl } from '../../platform/database.ts'
import type { Claimed } from './source-pass.ts'
import { DATABASE_DOWN, lost } from './source-pass.ts'
import { whileHeld } from './sources.ts'
import type { CopiesDeps, CopyRunEnd, StoredCopy } from './store.ts'
import { copy } from './tables.ts'

export type Retired =
  | Readonly<{ kind: 'COPY'; copy: StoredCopy }>
  | Readonly<{ kind: 'END'; end: CopyRunEnd }>

/**
 * The columns the copy's model stopped copying leave the copy before its sources are read: the
 * table first, then the stored definition, so a failed `ALTER TABLE` leaves both as they were and
 * the next run repeats it.
 */
export async function retiredColumns(
  deps: CopiesDeps,
  input: {
    claimed: Claimed
    sync: DatabaseUrl
    table: string
    end: (outcome: typeof DATABASE_DOWN) => Promise<CopyRunEnd>
  },
): Promise<Retired> {
  const { claimed, sync, table, end } = input
  const { copy: stored } = claimed
  const { companyId, id: copyId } = stored
  if (stored.definition.version !== 1 || stored.model === null)
    return { kind: 'COPY', copy: stored }
  const entry = deps
    .connectors()
    .catalog()
    .find((each) => each.connector === stored.connectorId && each.model.id === stored.model)
  const kept = stored.definition
  const gone = (entry?.model.retired ?? []).filter((name) =>
    kept.columns.some((column) => column.name === name),
  )
  if (entry === undefined || gone.length === 0) return { kind: 'COPY', copy: stored }
  const dropped = await deps.companyPostgres.dropCopyColumns(sync, {
    copy: table,
    columns: gone,
  })
  if (dropped.kind !== 'DONE') {
    const code = dropped.kind === 'REFUSED' ? dropped.code : dropped.kind
    deps.log.error({ companyId, copyId, code }, 'COPY_RETIRE_FAILED')
    return { kind: 'END', end: await end(DATABASE_DOWN) }
  }
  const definition = CopyDefinitionV1.parse({
    ...kept,
    source: entry.model.definition.source,
    columns: kept.columns.filter((column) => !gone.includes(column.name)),
  })
  const written = await whileHeld(deps, claimed.holder, (tx) =>
    tx.update(copy).set({ definition }).where(eq(copy.id, copyId)),
  )
  if (!written) return { kind: 'END', end: lost(deps, claimed) }
  deps.log.info({ companyId, copyId, columns: gone.length }, 'COPY_COLUMN_RETIRED')
  return { kind: 'COPY', copy: { ...stored, definition } }
}
