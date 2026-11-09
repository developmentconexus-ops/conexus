import { isDeepStrictEqual } from 'node:util'
import type {
  CompanyId,
  PersonId,
  WorkflowPlace,
  WorkflowProblem,
  WorkflowView,
} from '@conexus/hub-api'
import {
  PersonId as PersonIdSchema,
  ProjectId,
  WorkflowDraft,
  WorkflowId,
  WorkflowState,
} from '@conexus/hub-api'
import { and, eq } from 'drizzle-orm'
import type { CommandTx, ReadTx } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import type { FrozenWorkflow } from './frozen.ts'
import { FrozenWorkflowSchema } from './frozen.ts'
import { workflow, workflowVersion } from './tables.ts'
import type { CompanyWorkflow } from './world.ts'

export type WorkflowRow = typeof workflow.$inferSelect
type VersionRow = typeof workflowVersion.$inferSelect

export function placeOfRow(row: WorkflowRow): WorkflowPlace {
  return row.projectId === null
    ? { kind: 'COMPANY' }
    : { kind: 'PROJECT', projectId: ProjectId.parse(row.projectId) }
}

function ofCompany(companyId: CompanyId, id: WorkflowId) {
  return and(eq(workflow.companyId, companyId), eq(workflow.id, id))
}

async function found(rows: PromiseLike<WorkflowRow[]>): Promise<WorkflowRow> {
  const [row] = await rows
  if (row === undefined) throw new Failure('WORKFLOW_NOT_FOUND')
  return row
}

/** The workflow of the company the id names, or `WORKFLOW_NOT_FOUND`: the same answer for one that is not there and one of another company (security S10). */
export function workflowIn(tx: ReadTx, companyId: CompanyId, id: WorkflowId): Promise<WorkflowRow> {
  return found(tx.select().from(workflow).where(ofCompany(companyId, id)))
}

/** The same row, held until the transaction ends: of two writers one waits for the other. */
export function workflowHeld(
  tx: CommandTx,
  companyId: CompanyId,
  id: WorkflowId,
): Promise<WorkflowRow> {
  return found(tx.select().from(workflow).where(ofCompany(companyId, id)).for('update'))
}

export async function versionRows(tx: ReadTx, id: WorkflowId): Promise<VersionRow[]> {
  return tx.select().from(workflowVersion).where(eq(workflowVersion.workflowId, id))
}

/** Every workflow of the company with the version it runs and what that version froze: what a USE or the publishing checks read. */
export async function companyWorkflows(
  tx: ReadTx,
  companyId: CompanyId,
): Promise<CompanyWorkflow[]> {
  const rows = await tx.select().from(workflow).where(eq(workflow.companyId, companyId))
  const versions = await tx
    .select()
    .from(workflowVersion)
    .where(eq(workflowVersion.companyId, companyId))
  return rows.map((row) => {
    const active = versions.find(
      (each) => each.workflowId === row.id && each.number === row.activeVersion,
    )
    return {
      workflowId: WorkflowId.parse(row.id),
      place: placeOfRow(row),
      activeVersion: row.activeVersion,
      frozen: active === undefined ? null : FrozenWorkflowSchema.parse(active.frozen),
    }
  })
}

function personOf(id: string | null): PersonId | null {
  return id === null ? null : PersonIdSchema.parse(id)
}

function publishedOf(version: VersionRow | undefined, frozen: FrozenWorkflow | undefined) {
  if (version === undefined || frozen === undefined) return null
  return {
    number: version.number,
    draft: frozen.draft,
    agents: [...frozen.agents],
    uses: frozen.uses.map(({ balloonId, workflowId, versionNumber }) => ({
      ...{ balloonId, workflowId, versionNumber },
    })),
    publishedBy: personOf(version.publishedBy),
    publishedAt: version.publishedAt.toISOString(),
  }
}

/** The workflow as the page and the Construtor read it: the draft, its problems as of now, and the version it runs. */
export async function viewOf(
  tx: ReadTx,
  row: WorkflowRow,
  problems: readonly WorkflowProblem[],
): Promise<WorkflowView> {
  const draft = row.draft === null ? null : WorkflowDraft.parse(row.draft)
  const [active] =
    row.activeVersion === null
      ? []
      : await tx
          .select()
          .from(workflowVersion)
          .where(
            and(
              eq(workflowVersion.workflowId, row.id),
              eq(workflowVersion.number, row.activeVersion),
            ),
          )
  const frozen = active === undefined ? undefined : FrozenWorkflowSchema.parse(active.frozen)
  return {
    id: WorkflowId.parse(row.id),
    place: placeOfRow(row),
    name: row.name,
    revision: row.revision,
    draft,
    problems: [...problems],
    published: publishedOf(active, frozen),
    activeBy: personOf(row.activeBy),
    changed: frozen !== undefined && !isDeepStrictEqual(frozen.draft, draft),
    state: WorkflowState.parse(row.state),
  }
}
