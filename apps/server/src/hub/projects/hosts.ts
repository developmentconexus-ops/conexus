import type { CompanyId, HostLabel, PersonId } from '@conexus/hub-api'
import { CompanyId as CompanyIdSchema, ProjectId } from '@conexus/hub-api'
import { and, eq, isNull, sql } from 'drizzle-orm'
import { z } from 'zod'
import type { Database, ReadTx } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import type { IdentityPorts } from '../identity/public.ts'
import { project } from './tables.ts'

const HostRow = z.object({ project_id: ProjectId, company_id: CompanyIdSchema })

/**
 * The Projeto and company a host names. The Hub knows no company yet, so it asks the one function
 * that reads every company's labels and answers only these two ids (migration app_grants).
 */
export async function projectOfHost(
  database: Database,
  label: HostLabel,
): Promise<{ projectId: ProjectId; companyId: CompanyId } | undefined> {
  const rows = await database.installationRead((tx) =>
    tx.execute(sql`select project_id, company_id from projects.project_of_host(${label})`),
  )
  const [row] = rows.rows.map((found) => HostRow.parse(found))
  return row === undefined ? undefined : { projectId: row.project_id, companyId: row.company_id }
}

/** Whether a person may open the Projeto's app now, as they may read its Projects. */
export type AppAdmission =
  | { kind: 'ADMITTED'; projectName: string }
  | { kind: 'REFUSED'; reason: string }
  | { kind: 'NOT_FOUND' }

/**
 * Admission first, then the Projeto: a person taken out, or a company being deleted, is refused
 * even for a Projeto still there; a Projeto deleted is not found for whoever may read Projects.
 */
export function admitToApp(
  deps: { database: Database; identity: IdentityPorts },
  input: { personId: PersonId; companyId: CompanyId; projectId: ProjectId },
): Promise<AppAdmission> {
  const scope = { kind: 'COMPANY', companyId: input.companyId, personId: input.personId } as const
  return deps.database.read(scope, async (tx) => {
    try {
      const { personId, companyId } = input
      await deps.identity.admitMember({ tx, personId, companyId, action: 'readProjects' })
    } catch (error) {
      // Admission refuses with the same not-found for every reason (S10); the log keeps which.
      if (!(error instanceof Failure) || error.code !== 'NOT_FOUND') throw error
      const { reason } = error.details
      return { kind: 'REFUSED', reason: typeof reason === 'string' ? reason : 'UNKNOWN' } as const
    }
    const [row] = await tx
      .select({ name: project.name })
      .from(project)
      .where(and(eq(project.id, input.projectId), eq(project.companyId, input.companyId)))
    if (row === undefined) return { kind: 'NOT_FOUND' } as const
    return { kind: 'ADMITTED', projectName: row.name } as const
  })
}

/**
 * The Projeto of the company, unless deleted or marked for deletion: what a version is sent to and
 * put back on (code C4).
 */
export async function liveProjectOf(
  tx: ReadTx,
  input: { companyId: CompanyId; projectId: ProjectId },
): Promise<{ name: string } | undefined> {
  const [row] = await tx
    .select({ name: project.name })
    .from(project)
    .where(
      and(
        eq(project.id, input.projectId),
        eq(project.companyId, input.companyId),
        isNull(project.deletingSince),
      ),
    )
  return row
}
