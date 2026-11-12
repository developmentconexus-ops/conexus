import type {
  ConnectionId,
  CopyId,
  CopyInterval,
  CopyProposalId,
  ProjectId,
} from '@conexus/hub-api'
import { bodyHashOf } from '../../platform/attempt.ts'
import type { CommandTx } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import { connectionForCopy } from '../connectors/public.ts'
import { acceptedIn, acceptedProjectOf, earlierAttempt, insertedCopy } from './accept.ts'
import { grantedInDatabase } from './grants.ts'
import { dropEndedCopies } from './leave.ts'
import { mayCreate } from './schedule.ts'
import { sourcesOf } from './sources.ts'
import type { CopiesDeps, InCompany, StoredCopy } from './store.ts'
import { companyOwner, copyTableOf, parsedCopy, personScope, syncOf } from './store.ts'

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
  const { model } = made
  const row = await insertedCopy(tx, input, {
    ...{ connectorId: linked.connectorId, connectionId, accountRef: linked.accountRef },
    ...{ name: model.id, label: model.label },
    ...{ model: model.id, definition: model.definition, bodyHash: made.bodyHash },
  })
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
      if (again !== undefined) return { copy: parsedCopy(again) }
      return { copy: await fromModel(tx, { ...input, source }, { model, bodyHash }) }
    }
    const accepting = { ...input, proposalId: source.proposalId }
    if (again !== undefined) {
      const releaseTo = await acceptedProjectOf(tx, accepting)
      return { copy: parsedCopy(again), releaseTo }
    }
    const accepted = await acceptedIn(deps, tx, accepting, bodyHash)
    return { copy: accepted.copy, releaseTo: accepted.projectId }
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
  const { tablesLeft } = await dropEndedCopies(deps, input)
  if (tablesLeft.includes(stored.name)) throw unavailable
  const host = new URL(owner.reveal()).hostname
  const sources = await deps.database.read(personScope(input), (tx) =>
    sourcesOf(tx, { companyId, copyId }),
  )
  const table =
    answered.kind === 'DONE'
      ? await deps.companyPostgres.ensureCopyTable(
          await deps.companyPostgres.syncAddress(host),
          copyTableOf(stored, sources),
        )
      : answered
  if (table.kind !== 'DONE') {
    const code = table.kind === 'REFUSED' ? table.code : table.kind
    deps.log.error({ companyId, copyId, code }, 'COPY_DATABASE_FAILED')
    throw unavailable
  }
  // The release comes before the clock: a `GRANT` that fails leaves no schedule, so the retry with
  // the same key still gets the first run and its record (criteria 21 and 26). Only the call that
  // made the schedule asks for the first run and records it, so concurrent repeats record once (C37).
  if (made.releaseTo !== undefined)
    await released(deps, input, { stored, projectId: made.releaseTo })
  const schedule = await deps.clock().set({ companyId, copyId, interval: input.interval })
  if (schedule === 'CREATED') {
    await deps.clock().runNow(copyId)
    deps.log.info({ companyId, copyId, from: input.source.kind }, 'COPY_ENABLED')
  }
  return copyId
}
