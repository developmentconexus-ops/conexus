import type { PublishBody, WorkflowId, WorkflowView } from '@conexus/hub-api'
import { WorkflowDraft } from '@conexus/hub-api'
import { eq, max } from 'drizzle-orm'
import type { z } from 'zod'
import { Failure } from '../../platform/failure.ts'
import { compiled } from './compile.ts'
import { triggerShapeOf } from './compile-refs.ts'
import { dropWorkflow } from './definitions.ts'
import { problemsOf } from './problems.ts'
import { placeOfRow, versionRows, workflowHeld } from './store.ts'
import { workflow, workflowVersion } from './tables.ts'
import type { Acting, WorkflowsDeps } from './workflows.ts'
import { admitted, kitsFor, placeOf, scopeOf, viewIn } from './workflows.ts'
import { worldOf } from './world-of.ts'

/**
 * Freezes the draft of the revision read as the next version and makes it active (decision D22,
 * note I1: the registration goes in before the commit, so a refusal rolls the version back, and a
 * crash after it leaves a definition the start's pass drops). The row is held first, which waits
 * for a draft change in flight; the same revision again finds the version it made.
 */
export async function publishWorkflow(
  deps: WorkflowsDeps,
  who: Acting,
  id: WorkflowId,
  body: z.infer<typeof PublishBody>,
): Promise<WorkflowView> {
  if (deps.updating()) throw new Failure('HUB_UPDATING')
  const place = await placeOf(deps, who, id)
  const kits = await kitsFor(deps, who, place)
  const done = await deps.database.command(scopeOf(who), async (tx) => {
    const row = await workflowHeld(tx, who.companyId, id)
    await admitted(deps, tx, who, placeOfRow(row))
    const versions = await versionRows(tx, id)
    const earlier = versions.find((each) => each.sourceRevision === body.revision)
    if (earlier !== undefined) {
      return {
        view: await viewIn(deps, tx, { ...who, row, kits }),
        number: earlier.number,
        fresh: false,
      }
    }
    if (row.revision !== body.revision) throw new Failure('WORKFLOW_DRAFT_STALE')
    const draft = WorkflowDraft.parse(row.draft)
    const world = worldOf(deps, tx, { companyId: who.companyId, place: placeOfRow(row), kits })
    const { frozen, ready } = await problemsOf(world, id, draft, who.personId)
    if (ready === null || frozen === null) throw new Failure('WORKFLOW_HAS_PROBLEMS')
    const [last] = await tx
      .select({ number: max(workflowVersion.number) })
      .from(workflowVersion)
      .where(eq(workflowVersion.workflowId, id))
    const number = (last?.number ?? 0) + 1
    await tx.insert(workflowVersion).values({
      ...{ workflowId: id, number, companyId: who.companyId, frozen },
      ...{ sourceRevision: body.revision, publishedBy: who.personId },
    })
    await tx
      .update(workflow)
      .set({ activeVersion: number, activeBy: who.personId })
      .where(eq(workflow.id, id))
    const defs = compiled(
      { kind: 'VERSION', workflowId: id, version: number, path: [] },
      frozen,
      triggerShapeOf(draft.trigger),
    )
    try {
      await deps.mastra.addDynamicWorkflows(defs)
    } catch (cause) {
      throw new Failure('WORKFLOW_PUBLISH_REFUSED', { cause })
    }
    const published = await tx.select().from(workflow).where(eq(workflow.id, id))
    const [now] = published
    return { view: await viewIn(deps, tx, { ...who, row: now ?? row, kits }), number, fresh: true }
  })
  if (done.fresh) {
    deps.log.info(
      { companyId: who.companyId, workflowId: id, version: done.number },
      'WORKFLOW_PUBLISHED',
    )
  }
  return done.view
}

/** Deletes the workflow: its definitions in Mastra first, then its row, so a failure between them leaves a row the next delete finds. */
export async function deleteWorkflow(
  deps: WorkflowsDeps,
  who: Acting,
  id: WorkflowId,
): Promise<void> {
  if (deps.updating()) throw new Failure('HUB_UPDATING')
  await deps.database.command(scopeOf(who), async (tx) => {
    const row = await workflowHeld(tx, who.companyId, id)
    await admitted(deps, tx, who, placeOfRow(row))
    await dropWorkflow(deps.mastra, id)
    await tx.delete(workflow).where(eq(workflow.id, id))
  })
  deps.log.info({ companyId: who.companyId, workflowId: id }, 'WORKFLOW_DELETED')
}
