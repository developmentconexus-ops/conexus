import { randomUUID } from 'node:crypto'
import type { ConnectionId, ConnectorId, CopyInterval } from '@conexus/hub-api'
import { CopyId } from '@conexus/hub-api'
import { and, eq, sql } from 'drizzle-orm'
import { bodyHashOf } from '../../platform/attempt.ts'
import type { CommandTx } from '../../platform/database.ts'
import { violatedConstraint } from '../../platform/database.ts'
import type { Scalar } from '../../platform/failure.ts'
import { Failure } from '../../platform/failure.ts'
import { connectionForCopy } from '../connectors/public.ts'
import { mayCreate } from './schedule.ts'
import type { CopiesDeps, InCompany } from './store.ts'
import { companyOwner, parsedCopy, personScope } from './store.ts'
import { copy } from './tables.ts'

/** What a copy's definition comes from: a template of the connection's connector (Capacidade 3 adds its own). */
type CopySource = Readonly<{ kind: 'MODEL'; model: string }>

export type Enabling = InCompany & {
  connectionId: ConnectionId
  source: CopySource
  interval: CopyInterval
  attemptKey: string
}

/** The definition the source gives, from the connection's connector; none when it has no such template. */
async function definitionOf(deps: CopiesDeps, input: Enabling) {
  const models = await deps.connectors().models(input)
  return models?.find((model) => model.id === input.source.model)
}

type Model = NonNullable<Awaited<ReturnType<typeof definitionOf>>>

/** The row an earlier attempt with this key made, if any; the same key with another body is a conflict. */
async function earlierAttempt(tx: CommandTx, input: Enabling, bodyHash: string) {
  const [again] = await tx
    .select()
    .from(copy)
    .where(and(eq(copy.companyId, input.companyId), eq(copy.attemptKey, input.attemptKey)))
  if (again !== undefined && again.bodyHash !== bodyHash) throw new Failure('IDEMPOTENCY_CONFLICT')
  return again
}

/** The new row, from the template's definition on the connection's connector; a name taken is `COPY_EXISTS`. */
async function insertedCopy(
  tx: CommandTx,
  input: Enabling,
  made: { connectorId: ConnectorId; model: Model; bodyHash: string },
) {
  const { model, bodyHash } = made
  try {
    const [row] = await tx
      .insert(copy)
      .values({
        ...{ id: CopyId.parse(randomUUID()), companyId: input.companyId },
        ...{ connectorId: made.connectorId, connectionId: input.connectionId },
        ...{ name: model.id, label: model.label, model: model.id },
        ...{ definition: model.definition, createdBy: input.personId },
        ...{ createdAt: sql`statement_timestamp()`, attemptKey: input.attemptKey, bodyHash },
      })
      .returning()
    if (row === undefined) throw new Failure('COPY_EXISTS')
    return row
  } catch (error) {
    if (violatedConstraint(error) === 'copy_company_id_name_key') throw new Failure('COPY_EXISTS')
    throw error
  }
}

/**
 * The row, admitted and on an ACTIVE connection of the company, with the template's definition
 * copied into it; the same attempt key finds the row it made (code C37).
 */
async function recorded(deps: CopiesDeps, input: Enabling) {
  const bodyHash = bodyHashOf({
    connectionId: input.connectionId,
    source: input.source,
    interval: input.interval,
  })
  const model = await definitionOf(deps, input)
  return deps.database.command(personScope(input), async (tx) => {
    await deps.identity.admitMember({ tx, ...input, action: 'manageCopies' })
    const again = await earlierAttempt(tx, input, bodyHash)
    if (again !== undefined) return { fresh: false, copy: parsedCopy(again) }
    const linked = await connectionForCopy(tx, input)
    if (linked === undefined)
      throw new Failure('NOT_FOUND', { details: { reason: 'NO_CONNECTION' } })
    if (linked.kind !== 'ACTIVE') throw new Failure('COPY_CONNECTION_NOT_READY')
    if (model === undefined) throw new Failure('COPY_MODEL_UNKNOWN')
    const row = await insertedCopy(tx, input, { connectorId: linked.connectorId, model, bodyHash })
    return { fresh: true, copy: parsedCopy(row) }
  })
}

/**
 * Ligar (Capacidade 2, U2): the row first, then, with no transaction open (data D22), the `sync`
 * schema, its login and the copy's table in the company's database, and last the clock. The same
 * attempt key takes up whatever step a cut left; the company's database silent refuses with 503 and
 * keeps the row.
 */
export async function enableCopy(deps: CopiesDeps, input: Enabling): Promise<CopyId> {
  // Before the row: a schedule made while the scheduler stops would start it again.
  mayCreate(deps)
  const made = await recorded(deps, input)
  const stored = made.copy
  const unavailable = new Failure('COPY_DATABASE_UNAVAILABLE')
  const owner = await companyOwner(deps, input)
  if (owner === undefined) throw unavailable
  const { companyId } = input
  const copyId = stored.id
  const answered = await deps.companyPostgres.ensureSync(owner)
  const host = new URL(owner.reveal()).hostname
  const table =
    answered.kind === 'DONE'
      ? await deps.companyPostgres.ensureCopyTable(await deps.companyPostgres.syncAddress(host), {
          name: stored.name,
          definition: stored.definition,
        })
      : answered
  if (table.kind !== 'DONE') {
    const code = table.kind === 'REFUSED' ? table.code : table.kind
    deps.log.error({ companyId, copyId, code }, 'COPY_DATABASE_FAILED')
    throw unavailable
  }
  // A first run is asked for only when the schedule is new: a repeat, or a retry after the schedule
  // was made, does nothing more (criterion 7); a retry after a cut before it still gets its run.
  const scheduled = (await deps.clock().states(companyId)).has(copyId)
  await deps.clock().set({ companyId, copyId, interval: input.interval })
  if (!scheduled) await deps.clock().runNow(copyId)
  if (made.fresh) {
    // A copy turned on from a proposal has no template (Capacity 3).
    const fields: Record<string, Scalar> = { companyId, copyId }
    if (stored.model !== null) fields.model = stored.model
    deps.log.info(fields, 'COPY_ENABLED')
  }
  return copyId
}
