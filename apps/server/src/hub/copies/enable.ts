import { randomUUID } from 'node:crypto'
import type { ConnectionId, CopyInterval } from '@conexus/hub-api'
import { CopyId } from '@conexus/hub-api'
import { and, eq, sql } from 'drizzle-orm'
import { bodyHashOf } from '../../platform/attempt.ts'
import { violatedConstraint } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import { connectionForCopy } from '../connectors/public.ts'
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
    const [again] = await tx
      .select()
      .from(copy)
      .where(and(eq(copy.companyId, input.companyId), eq(copy.attemptKey, input.attemptKey)))
    if (again !== undefined) {
      if (again.bodyHash !== bodyHash) throw new Failure('IDEMPOTENCY_CONFLICT')
      return { fresh: false, copy: parsedCopy(again) }
    }
    const linked = await connectionForCopy(tx, input)
    if (linked === undefined)
      throw new Failure('NOT_FOUND', { details: { reason: 'NO_CONNECTION' } })
    if (linked.kind !== 'ACTIVE') throw new Failure('COPY_CONNECTION_NOT_READY')
    if (model === undefined) throw new Failure('COPY_MODEL_UNKNOWN')
    try {
      const [made] = await tx
        .insert(copy)
        .values({
          ...{ id: CopyId.parse(randomUUID()), companyId: input.companyId },
          ...{ connectorId: linked.connectorId, connectionId: input.connectionId },
          ...{ name: model.id, label: model.label, model: model.id },
          ...{ definition: model.definition, createdBy: input.personId },
          ...{ createdAt: sql`statement_timestamp()`, attemptKey: input.attemptKey, bodyHash },
        })
        .returning()
      if (made === undefined) throw new Failure('COPY_EXISTS')
      return { fresh: true, copy: parsedCopy(made) }
    } catch (error) {
      if (violatedConstraint(error) === 'copy_company_id_name_key') throw new Failure('COPY_EXISTS')
      throw error
    }
  })
}

/**
 * Ligar (Capacidade 2, U2): the row first, then, with no transaction open (data D22), the `sync`
 * schema, its login and the copy's table in the company's database, and last the clock. The same
 * attempt key takes up whatever step a cut left; the company's database silent refuses with 503 and
 * keeps the row.
 */
export async function enableCopy(deps: CopiesDeps, input: Enabling): Promise<CopyId> {
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
  await deps.clock().set({ companyId, copyId, interval: input.interval })
  await deps.clock().runNow(copyId)
  if (made.fresh) deps.log.info({ companyId, copyId, model: stored.model }, 'COPY_ENABLED')
  return copyId
}
