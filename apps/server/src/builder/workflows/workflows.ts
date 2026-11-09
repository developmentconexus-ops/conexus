import type {
  CompanyId,
  CreateWorkflowBody,
  PersonId,
  SaveDraftBody,
  WorkflowPlace,
  WorkflowView,
} from '@conexus/hub-api'
import { WorkflowDraft, WorkflowId } from '@conexus/hub-api'
import type { Mastra } from '@mastra/core/mastra'
import { and, eq, sql } from 'drizzle-orm'
import type { z } from 'zod'
import type { SessionScope } from '../../hub/connectors/public.ts'
import type { Database, ReadTx } from '../../platform/database.ts'
import type { FailureLog } from '../../platform/failure.ts'
import { Failure } from '../../platform/failure.ts'
import { bodyHashOf } from '../conversation/public.ts'
import type { ToolConnectors, ToolsDeps } from '../tools/public.ts'
import { derivedUuid } from '../tools/public.ts'
import { problemsOf } from './problems.ts'
import type { WorkflowRow } from './store.ts'
import { placeOfRow, viewOf, workflowHeld, workflowIn } from './store.ts'
import { workflow } from './tables.ts'
import type { OfferedKit } from './world.ts'
import type { WorldDeps } from './world-of.ts'
import { kitsOf, worldOf } from './world-of.ts'

export type WorkflowsDeps = WorldDeps &
  Readonly<{
    database: Database
    liveProjectOf: ToolsDeps['liveProjectOf']
    connectors: Pick<ToolConnectors, 'listing' | 'operationOf' | 'writeOf'>
    mastra: Mastra
    updating: () => boolean
    log: FailureLog
  }>

/** Who acts, in which company: the session's person and the route's company (security S9). */
export type Acting = Readonly<{ companyId: CompanyId; personId: PersonId }>

export function scopeOf(who: Acting) {
  return { kind: 'COMPANY', companyId: who.companyId, personId: who.personId } as const
}

function sessionOf(who: Acting, place: WorkflowPlace): SessionScope {
  return { ...who, place, chosen: [] }
}

/** The person may manage the company's automations now, and a Projeto's workflow needs the Projeto live; else the same `WORKFLOW_NOT_FOUND`. */
export async function admitted(
  deps: Pick<WorkflowsDeps, 'identity' | 'liveProjectOf'>,
  tx: ReadTx,
  who: Acting,
  place: WorkflowPlace,
): Promise<void> {
  const { companyId, personId } = who
  await deps.identity.admitMember({ tx, companyId, personId, action: 'manageAutomations' })
  if (place.kind === 'PROJECT') {
    const live = await deps.liveProjectOf(tx, { companyId, projectId: place.projectId })
    if (live === undefined) throw new Failure('WORKFLOW_NOT_FOUND')
  }
}

/** Where a workflow lives, read before what needs its connections (the connectors' door has transactions of its own). */
export async function placeOf(
  deps: WorkflowsDeps,
  who: Acting,
  id: WorkflowId,
): Promise<WorkflowPlace> {
  return deps.database.read(scopeOf(who), async (tx) =>
    placeOfRow(await workflowIn(tx, who.companyId, id)),
  )
}

export function kitsFor(
  deps: WorkflowsDeps,
  who: Acting,
  place: WorkflowPlace,
): Promise<OfferedKit[]> {
  return kitsOf(deps, sessionOf(who, place))
}

/** The workflow as read now: its problems are recomputed against the company as it is. */
export async function viewIn(
  deps: WorkflowsDeps,
  tx: ReadTx,
  a: Acting & { row: WorkflowRow; kits: readonly OfferedKit[] },
): Promise<WorkflowView> {
  const { row, kits, companyId, personId } = a
  const id = WorkflowId.parse(row.id)
  const draft = row.draft === null ? null : WorkflowDraft.parse(row.draft)
  const problems =
    draft === null
      ? []
      : (
          await problemsOf(
            worldOf(deps, tx, { companyId, place: placeOfRow(row), kits }),
            id,
            draft,
            personId,
          )
        ).problems
  return viewOf(tx, row, problems)
}

/** A new workflow from a draft, keyed by its attempt (code C37): the same attempt and body finds it, another body is `IDEMPOTENCY_CONFLICT`. */
export async function createWorkflow(
  deps: WorkflowsDeps,
  who: Acting,
  body: z.infer<typeof CreateWorkflowBody>,
  attemptKey: string,
): Promise<WorkflowView> {
  const id = WorkflowId.parse(derivedUuid('workflow', who.companyId, who.personId, attemptKey))
  const bodyHash = bodyHashOf(body)
  await deps.database.read(scopeOf(who), (tx) => admitted(deps, tx, who, body.place))
  const kits = await kitsFor(deps, who, body.place)
  const made = await deps.database.command(scopeOf(who), async (tx) => {
    await admitted(deps, tx, who, body.place)
    await tx
      .insert(workflow)
      .values({
        ...{ id, companyId: who.companyId, name: body.draft.name, draft: body.draft },
        ...{ projectId: body.place.kind === 'PROJECT' ? body.place.projectId : null },
        ...{ createdBy: who.personId, bodyHash },
      })
      .onConflictDoNothing()
    const row = await workflowIn(tx, who.companyId, id)
    if (row.bodyHash !== bodyHash) throw new Failure('IDEMPOTENCY_CONFLICT')
    return viewIn(deps, tx, { ...who, row, kits })
  })
  deps.log.info({ companyId: who.companyId, workflowId: id }, 'WORKFLOW_CREATED')
  return made
}

export async function getWorkflow(
  deps: WorkflowsDeps,
  who: Acting,
  id: WorkflowId,
): Promise<WorkflowView> {
  const place = await placeOf(deps, who, id)
  const kits = await kitsFor(deps, who, place)
  return deps.database.read(scopeOf(who), async (tx) => {
    const row = await workflowIn(tx, who.companyId, id)
    await admitted(deps, tx, who, placeOfRow(row))
    return viewIn(deps, tx, { ...who, row, kits })
  })
}

/**
 * Saves the draft at the revision the writer read (code C38): the update holds the row, so of two
 * at the same revision one writes and the other finds no row (`WORKFLOW_DRAFT_STALE`). A draft
 * with problems is saved too, with its list.
 */
export async function saveDraft(
  deps: WorkflowsDeps,
  who: Acting,
  id: WorkflowId,
  body: z.infer<typeof SaveDraftBody>,
): Promise<WorkflowView> {
  const place = await placeOf(deps, who, id)
  const kits = await kitsFor(deps, who, place)
  return deps.database.command(scopeOf(who), async (tx) => {
    const held = await workflowHeld(tx, who.companyId, id)
    await admitted(deps, tx, who, placeOfRow(held))
    const [saved] = await tx
      .update(workflow)
      .set({ draft: body.draft, name: body.draft.name, revision: sql`${workflow.revision} + 1` })
      .where(
        and(
          eq(workflow.companyId, who.companyId),
          eq(workflow.id, id),
          eq(workflow.revision, body.revision),
        ),
      )
      .returning()
    if (saved === undefined) throw new Failure('WORKFLOW_DRAFT_STALE')
    return viewIn(deps, tx, { ...who, row: saved, kits })
  })
}
