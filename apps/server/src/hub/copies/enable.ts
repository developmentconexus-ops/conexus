import { randomUUID } from 'node:crypto'
import type {
  ConnectionId,
  ConnectorId,
  CopyInterval,
  CopyProposalId,
  ProjectId,
} from '@conexus/hub-api'
import { CopyId } from '@conexus/hub-api'
import { and, eq, sql } from 'drizzle-orm'
import { bodyHashOf } from '../../platform/attempt.ts'
import type { CommandTx } from '../../platform/database.ts'
import { violatedConstraint } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import { connectionForCopy } from '../connectors/public.ts'
import { acceptedIn, acceptedProjectOf } from './accept.ts'
import { grantedInDatabase } from './grants.ts'
import { mayCreate } from './schedule.ts'
import type { CopiesDeps, InCompany, StoredCopy } from './store.ts'
import { companyOwner, parsedCopy, personScope, syncOf } from './store.ts'
import { copy } from './tables.ts'

/** What a copy's definition comes from: a template of the connection's connector, or the Builder's proposal (Capacidade 3). */
type CopySource =
  | Readonly<{ kind: 'MODEL'; connectionId: ConnectionId; model: string }>
  | Readonly<{ kind: 'PROPOSAL'; proposalId: CopyProposalId }>

export type Enabling = InCompany & {
  source: CopySource
  interval: CopyInterval
  attemptKey: string
}

/** The definition the template gives, from the connection's connector; none when it has no such template. */
async function definitionOf(
  deps: CopiesDeps,
  input: InCompany & { source: Extract<CopySource, { kind: 'MODEL' }> },
) {
  const { connectionId, model } = input.source
  const models = await deps.connectors().models({ companyId: input.companyId, connectionId })
  return models?.find((each) => each.id === model)
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
  input: Enabling & { connectionId: ConnectionId },
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
 * The hash of what the attempt asked, the key's body (code C37): a template's keeps Capacidade 2's
 * shape, so a retry across the change still finds its row.
 */
function bodyHashFor(input: Enabling): string {
  const { source, interval } = input
  return source.kind === 'MODEL'
    ? bodyHashOf({
        connectionId: source.connectionId,
        source: { kind: 'MODEL', model: source.model },
        interval,
      })
    : bodyHashOf({ source, interval })
}

/** Ligar from a template: the row on an ACTIVE connection of the company, with the template's definition copied into it. */
async function fromModel(
  tx: CommandTx,
  input: Enabling & { source: Extract<CopySource, { kind: 'MODEL' }> },
  made: { model: Model | undefined; bodyHash: string },
) {
  const { connectionId } = input.source
  const linked = await connectionForCopy(tx, { companyId: input.companyId, connectionId })
  if (linked === undefined) throw new Failure('NOT_FOUND', { details: { reason: 'NO_CONNECTION' } })
  if (linked.kind !== 'ACTIVE') throw new Failure('COPY_CONNECTION_NOT_READY')
  if (made.model === undefined) throw new Failure('COPY_MODEL_UNKNOWN')
  const row = await insertedCopy(
    tx,
    { ...input, connectionId },
    { connectorId: linked.connectorId, model: made.model, bodyHash: made.bodyHash },
  )
  return parsedCopy(row)
}

/**
 * The row, admitted, from the template or the proposal; the same attempt key finds the row it made
 * (code C37), and a proposal's retry its Projeto again, so the release repeats.
 */
async function recorded(deps: CopiesDeps, input: Enabling) {
  const bodyHash = bodyHashFor(input)
  const { source } = input
  const model = source.kind === 'MODEL' ? await definitionOf(deps, { ...input, source }) : undefined
  return deps.database.command(personScope(input), async (tx) => {
    await deps.identity.admitMember({ tx, ...input, action: 'manageCopies' })
    const again = await earlierAttempt(tx, input, bodyHash)
    if (source.kind === 'MODEL') {
      if (again !== undefined) return { fresh: false, copy: parsedCopy(again) }
      return { fresh: true, copy: await fromModel(tx, { ...input, source }, { model, bodyHash }) }
    }
    const accepting = { ...input, proposalId: source.proposalId }
    if (again !== undefined) {
      const releaseTo = await acceptedProjectOf(tx, accepting)
      return { fresh: false, copy: parsedCopy(again), releaseTo }
    }
    const accepted = await acceptedIn(deps, tx, accepting, bodyHash)
    return { fresh: true, copy: accepted.copy, releaseTo: accepted.projectId }
  })
}

/** The proposal's copy released to its Projeto in the company's database: the same steps as Liberar's, repeatable. */
async function released(
  deps: CopiesDeps,
  input: InCompany,
  release: { stored: StoredCopy; projectId: ProjectId },
) {
  const { companyId } = input
  const sync = await deps.database.read(personScope(input), (tx) => syncOf(deps, tx, companyId))
  const { projectId } = release
  const granted = await grantedInDatabase(
    deps,
    { ...input, projectId },
    { name: release.stored.name, sync },
  )
  if (granted?.kind === 'DONE') return
  const code =
    granted === undefined ? 'NO_DATABASE' : granted.kind === 'REFUSED' ? granted.code : granted.kind
  deps.log.error({ companyId, projectId, copyId: release.stored.id, code }, 'COPY_GRANT_FAILED')
  throw new Failure('COPY_DATABASE_UNAVAILABLE')
}

/**
 * Ligar (Capacidade 2, U2): the row first, then, with no transaction open (data D22), the `sync`
 * schema, its login and the copy's table in the company's database, a proposal's release to its
 * Projeto (Capacidade 3), and last the clock. The same
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
  if (made.releaseTo !== undefined)
    await released(deps, input, { stored, projectId: made.releaseTo })
  if (!scheduled) await deps.clock().runNow(copyId)
  if (made.fresh) deps.log.info({ companyId, copyId, from: input.source.kind }, 'COPY_ENABLED')
  return copyId
}
