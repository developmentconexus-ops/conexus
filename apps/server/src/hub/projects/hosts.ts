import type { CallerAccess } from '@conexus/app-contract'
import type { AppEntry, CompanyId, HostLabel, PersonId } from '@conexus/hub-api'
import {
  appHostOf,
  CompanyId as CompanyIdSchema,
  HostLabel as HostLabelSchema,
  PAGE_SIZE,
  ProjectId,
} from '@conexus/hub-api'
import { and, asc, eq, isNull, sql } from 'drizzle-orm'
import { z } from 'zod'
import type { Database, ReadTx } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import type { IdentityPorts } from '../identity/public.ts'
import { appAccess, project } from './tables.ts'

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

const AppOfPerson = z.object({
  project_name: z.string().min(1),
  company_name: z.string().min(1),
  host_label: HostLabelSchema.nullable(),
})

/**
 * The apps a person uses, from every company, through the one function that reads their rows
 * (migration e18_app_grants): each with its company and the address it opens at. A Projeto made
 * before addresses has none to open, so it is not listed.
 */
export async function appsOfPerson(
  deps: { database: Database; appsDomain: string },
  personId: PersonId,
): Promise<AppEntry[]> {
  const rows = await deps.database.installationRead((tx) =>
    tx.execute(sql`select project_name, company_name, host_label
      from projects.apps_of_person(${personId}) order by project_name, company_name`),
  )
  return rows.rows.flatMap((found) => {
    const row = AppOfPerson.parse(found)
    if (row.host_label === null) return []
    const address = appHostOf({ label: row.host_label, appsDomain: deps.appsDomain })
    return [{ projectName: row.project_name, companyName: row.company_name, address }]
  })
}

/** Whether a person may open the Projeto's app now, and how they hold it. */
export type AppAdmission =
  | { kind: 'ADMITTED'; projectName: string; access: CallerAccess }
  | Refused
  | { kind: 'NOT_FOUND' }

/**
 * How the person holds the app, or why not, by the reason the member's admission refused. A member
 * builds it and holds every role, in the Prévia and the published app (E1); a person given the app
 * holds the role of their row, read now (S8), in the published app only; anyone else is refused.
 */
async function accessOf(
  deps: { identity: IdentityPorts },
  tx: ReadTx,
  input: {
    personId: PersonId
    companyId: CompanyId
    projectId: ProjectId
    environment: 'preview' | 'published'
  },
): Promise<CallerAccess | Refused> {
  const { personId, companyId, projectId } = input
  let refused: Refused
  try {
    await deps.identity.admitMember({ tx, personId, companyId, action: 'readProjects' })
    return { kind: 'BUILDER' }
  } catch (error) {
    refused = refusalOf(error)
  }
  if (refused.reason !== 'OUTSIDER' || input.environment !== 'published') return refused
  const [row] = await tx
    .select({ role: appAccess.role })
    .from(appAccess)
    .where(
      and(
        eq(appAccess.projectId, projectId),
        eq(appAccess.companyId, companyId),
        eq(appAccess.personId, personId),
      ),
    )
  if (row === undefined) return refused
  try {
    await deps.identity.admitAppUser(tx, { companyId })
  } catch (error) {
    return refusalOf(error)
  }
  return { kind: 'USER', role: row.role }
}

type Refused = { kind: 'REFUSED'; reason: string }

/** Admission refuses with the same not-found for every reason (S10); the log keeps which. */
function refusalOf(error: unknown): Refused {
  if (!(error instanceof Failure) || error.code !== 'NOT_FOUND') throw error
  const { reason } = error.details
  return { kind: 'REFUSED', reason: typeof reason === 'string' ? reason : 'UNKNOWN' }
}

/**
 * Admission first, then the Projeto: a person taken out, or a company being deleted, is refused
 * even for a Projeto still there; a Projeto deleted is not found for whoever may open it. The one
 * rule of who opens an app, a member before any row (step 18), lives here.
 */
export function admitToApp(
  deps: { database: Database; identity: IdentityPorts },
  input: {
    personId: PersonId
    companyId: CompanyId
    projectId: ProjectId
    // A literal: the apps' `AppEnvironment` would close a cycle, apps importing Projects (code C6).
    environment: 'preview' | 'published'
  },
): Promise<AppAdmission> {
  const scope = { kind: 'COMPANY', companyId: input.companyId, personId: input.personId } as const
  return deps.database.read(scope, async (tx) => {
    const access = await accessOf(deps, tx, input)
    if (access.kind === 'REFUSED') return access
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
    if (row === undefined) return { kind: 'NOT_FOUND' } as const
    return { kind: 'ADMITTED', projectName: row.name, access } as const
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

/** The company's live Projetos by name, at most a page of them: what the Assistant tells of the company (step 24.1). */
export async function liveProjectsOf(
  tx: ReadTx,
  companyId: CompanyId,
): Promise<{ projectId: ProjectId; name: string }[]> {
  const rows = await tx
    .select({ id: project.id, name: project.name })
    .from(project)
    .where(and(eq(project.companyId, companyId), isNull(project.deletingSince)))
    .orderBy(asc(project.name), asc(project.id))
    .limit(PAGE_SIZE)
  return rows.map((row) => ({ projectId: ProjectId.parse(row.id), name: row.name }))
}
