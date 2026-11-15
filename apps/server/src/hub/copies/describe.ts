import { eq } from 'drizzle-orm'
import type { DatabaseUrl } from '../../platform/database.ts'
import type { CopyDefinition } from '../connectors/public.ts'
import type { Claimed } from './source-pass.ts'
import { whileHeld } from './sources.ts'
import type { CopiesDeps, StoredCopy } from './store.ts'
import { copyTableOf } from './store.ts'
import { copy } from './tables.ts'

type DefinitionV1 = Extract<CopyDefinition, { version: 1 }>

/** The template's descriptions the stored definition lacks, copied in; none replaced (C2, passo 3). Undefined: nothing to fill. */
export function filledFrom(stored: DefinitionV1, model: DefinitionV1): DefinitionV1 | undefined {
  const texts = new Map(
    model.columns.flatMap((column) =>
      column.description === undefined ? [] : [[column.name, column.description] as const],
    ),
  )
  const description = stored.description ?? model.description
  const columns = stored.columns.map((column) => {
    const text = column.description === undefined ? texts.get(column.name) : undefined
    return text === undefined ? column : { ...column, description: text }
  })
  const changed =
    description !== stored.description ||
    columns.some((column, at) => column !== stored.columns[at])
  if (!changed) return undefined
  return { ...stored, ...(description === undefined ? {} : { description }), columns }
}

export type Described =
  | Readonly<{ kind: 'COPY'; copy: StoredCopy }>
  | Readonly<{ kind: 'DATABASE_DOWN' }>
  | Readonly<{ kind: 'LOST' }>

/**
 * The copy a run starts from: a copy that came from a template and lacks its descriptions gets them
 * in the company's table first (`COMMENT ON`, through `ensureCopyTable`), and in the stored definition
 * only after, so a silent company database leaves the definition for the next run (C2, passo 3).
 */
export async function describedCopy(
  deps: CopiesDeps,
  input: { claimed: Claimed; sync: DatabaseUrl },
): Promise<Described> {
  const { claimed, sync } = input
  const { copy: stored } = claimed
  const { companyId, id: copyId } = stored
  if (stored.definition.version !== 1 || stored.model === null)
    return { kind: 'COPY', copy: stored }
  const model = deps
    .connectors()
    .catalog()
    .find((entry) => entry.connector === stored.connectorId && entry.model.id === stored.model)
  if (model === undefined) {
    deps.log.error({ companyId, copyId, model: stored.model }, 'COPY_MODEL_GONE')
    return { kind: 'COPY', copy: stored }
  }
  const definition = filledFrom(stored.definition, model.model.definition)
  if (definition === undefined) return { kind: 'COPY', copy: stored }
  const table = await deps.companyPostgres.ensureCopyTable(
    sync,
    copyTableOf({ ...stored, definition }, claimed.sources),
  )
  if (table.kind !== 'DONE') {
    const code = table.kind === 'REFUSED' ? table.code : table.kind
    deps.log.error({ companyId, copyId, code }, 'COPY_DATABASE_FAILED')
    return { kind: 'DATABASE_DOWN' }
  }
  const written = await whileHeld(deps, claimed.holder, (tx) =>
    tx.update(copy).set({ definition }).where(eq(copy.id, copyId)),
  )
  return written ? { kind: 'COPY', copy: { ...stored, definition } } : { kind: 'LOST' }
}
