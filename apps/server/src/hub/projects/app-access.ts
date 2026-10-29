import type {
  AppAccessRow,
  CompanyAppPerson,
  CompanyId,
  Person,
  PersonId,
  ProjectId,
} from '@conexus/hub-api'
import {
  appHostOf,
  HostLabel,
  PAGE_SIZE,
  PersonId as PersonIdSchema,
  ProjectId as ProjectIdSchema,
} from '@conexus/hub-api'
import { and, asc, eq, inArray, isNull, notInArray, sql } from 'drizzle-orm'
import type { AppsDomain } from '../../platform/config.ts'
import type { CommandTx, Database, ReadTx } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import { after, pageKey, pageOf } from '../../platform/pages.ts'
import type { IdentityPorts, ProjectApps } from '../identity/public.ts'
import { appsOfPerson, liveProjectOf } from './hosts.ts'
import type { AppSessionsEnd, PublishedRolesOf } from './ports.ts'
import { appAccess, project } from './tables.ts'

export type AccessDeps = {
  database: Database
  identity: IdentityPorts
  appsDomain: AppsDomain
  publishedRolesOf: PublishedRolesOf
  endAppSessions: AppSessionsEnd
}

type Roles = readonly { name: string; label: string }[]
type OfProject = { companyId: CompanyId; projectId: ProjectId }

/**
 * Whether the role names one the published version declares; an app that declares none takes no
 * role. A role it stops declaring stays on the row, inert (step 18).
 */
function declared(roles: Roles, role: string | null): boolean {
  if (role === null) return roles.length === 0
  return roles.some((one) => one.name === role)
}

/** The published version's roles, or `APP_NOT_PUBLISHED` before the first Publicar. */
async function publishedRoles(deps: AccessDeps, tx: ReadTx, projectId: ProjectId) {
  const published = await deps.publishedRolesOf(tx, projectId)
  if (!published.published) throw new Failure('APP_NOT_PUBLISHED', { details: { projectId } })
  return published.roles
}

async function liveProject(tx: ReadTx, ids: OfProject) {
  const live = await liveProjectOf(tx, ids)
  if (live === undefined) throw new Failure('NOT_FOUND', { details: { reason: 'NO_PROJECT' } })
  return live
}

async function uses(tx: ReadTx, ids: { projectId: ProjectId; personId: PersonId }) {
  const [row] = await tx
    .select({ personId: appAccess.personId })
    .from(appAccess)
    .where(and(eq(appAccess.projectId, ids.projectId), eq(appAccess.personId, ids.personId)))
  return row !== undefined
}

/** What an app's invitation asks of Projects, under the company's lock identity holds (code C4). */
export function projectAppsOf(deps: AccessDeps): ProjectApps {
  return Object.freeze({
    async checkInvitation(tx, input) {
      await liveProject(tx, input)
      const roles = await publishedRoles(deps, tx, input.projectId)
      if (!declared(roles, input.role)) throw new Failure('APP_ROLE_UNKNOWN')
      const { personId } = input
      if (personId !== undefined && (await uses(tx, { ...input, personId })))
        throw new Failure('APP_ACCESS_EXISTS')
    },
    async appOf(tx, ids) {
      const [row] = await tx
        .select({ name: project.name, label: project.hostLabel })
        .from(project)
        .where(
          and(
            eq(project.id, ids.projectId),
            eq(project.companyId, ids.companyId),
            isNull(project.deletingSince),
          ),
        )
      if (row?.label == null) return undefined
      const label = HostLabel.parse(row.label)
      const address = appHostOf({ label, appsDomain: deps.appsDomain })
      return { projectName: row.name, address }
    },
    uses,
    async grant(tx, row) {
      await tx.insert(appAccess).values(row)
    },
    takeAccess,
    endSessions: (ids) => endSessions(deps, ids),
  })
}

/** Deletes a person's rows in the company, one Projeto's or all of them, and answers their Projetos. */
async function takeAccess(
  tx: CommandTx,
  ids: { companyId: CompanyId; personId: PersonId; projectId?: ProjectId },
): Promise<ProjectId[]> {
  const rows = await tx
    .delete(appAccess)
    .where(
      and(
        eq(appAccess.companyId, ids.companyId),
        eq(appAccess.personId, ids.personId),
        ids.projectId === undefined ? undefined : eq(appAccess.projectId, ids.projectId),
      ),
    )
    .returning({ projectId: appAccess.projectId })
  return rows.map((row) => ProjectIdSchema.parse(row.projectId))
}

/** Ends the person's sessions in those Projetos' apps, after the commit that took their access. */
async function endSessions(deps: AccessDeps, ids: Parameters<ProjectApps['endSessions']>[0]) {
  for (const projectId of ids.projectIds)
    await deps.endAppSessions({ projectId, personId: ids.personId })
}

function scopeOf(input: { person: Person; companyId: CompanyId }) {
  return { kind: 'COMPANY', companyId: input.companyId, personId: input.person.id } as const
}

type Granted = Pick<typeof appAccess.$inferSelect, 'personId' | 'role' | 'grantedAt'>

/** The rows of the people given the app, members left out: a member's row is inert (E1). */
async function rowsOf(deps: AccessDeps, tx: ReadTx, input: { rows: Granted[]; roles: Roles }) {
  const ids = input.rows.map((row) => PersonIdSchema.parse(row.personId))
  const named = await deps.identity.peopleNamed(tx, ids)
  return input.rows.flatMap((row): AppAccessRow[] => {
    const person = named.get(PersonIdSchema.parse(row.personId))
    if (person === undefined) return []
    const roleDeclared = declared(input.roles, row.role)
    return [{ ...person, role: row.role, roleDeclared, grantedAt: row.grantedAt.toISOString() }]
  })
}

/** Who uses a Projeto's app, for any member (B2); only who may manage it gets the controls. */
export function readProjectAccess(deps: AccessDeps, input: OfProject & { person: Person }) {
  return deps.database.read(scopeOf(input), async (tx) => {
    const { companyId, projectId } = input
    const personId = input.person.id
    const admitted = await deps.identity.admitMember({
      tx,
      personId,
      companyId,
      action: 'readAppAccess',
    })
    await liveProject(tx, input)
    const { published, roles } = await deps.publishedRolesOf(tx, projectId)
    const members = await deps.identity.companyMembersOf(tx, companyId)
    const granted = await tx
      .select({
        personId: appAccess.personId,
        role: appAccess.role,
        grantedAt: appAccess.grantedAt,
      })
      .from(appAccess)
      .where(
        and(
          eq(appAccess.projectId, projectId),
          eq(appAccess.companyId, companyId),
          notInArray(
            appAccess.personId,
            members.map((one) => one.personId),
          ),
        ),
      )
      .orderBy(asc(appAccess.grantedAt), asc(appAccess.personId))
    return {
      roles: [...roles],
      published,
      members,
      people: await rowsOf(deps, tx, { rows: granted, roles }),
      invitations: await deps.identity.openAppInvitations(tx, input),
      mayManage: deps.identity.allows(admitted.role, 'manageAppAccess'),
    }
  })
}

/** The company's lock, then the capability to manage who uses its apps: every change's order. */
async function admittedManager(
  deps: AccessDeps,
  tx: CommandTx,
  input: { person: Person; companyId: CompanyId },
) {
  await deps.identity.lockCompany(tx, input.companyId)
  const { companyId } = input
  const personId = input.person.id
  await deps.identity.admitMember({ tx, personId, companyId, action: 'manageAppAccess' })
}

/** Changes the role of a person given the app to one the published version declares. */
export function changeAccess(
  deps: AccessDeps,
  input: OfProject & { person: Person; personId: PersonId; role: string },
) {
  return deps.database.command(scopeOf(input), async (tx) => {
    await admittedManager(deps, tx, input)
    await liveProject(tx, input)
    const roles = await publishedRoles(deps, tx, input.projectId)
    if (!declared(roles, input.role)) throw new Failure('APP_ROLE_UNKNOWN')
    const changed = await tx
      .update(appAccess)
      .set({ role: input.role })
      .where(
        and(
          eq(appAccess.projectId, input.projectId),
          eq(appAccess.companyId, input.companyId),
          eq(appAccess.personId, input.personId),
        ),
      )
      .returning({
        personId: appAccess.personId,
        role: appAccess.role,
        grantedAt: appAccess.grantedAt,
      })
    const [person] = await rowsOf(deps, tx, { rows: changed, roles })
    if (person === undefined) throw new Failure('NOT_FOUND')
    return person
  })
}

/**
 * Takes a person's access to the company's apps, one Projeto's or all of them: the rows and their
 * open invitations to those apps in one transaction (D22), then their sessions in those apps, after
 * the commit, through the Hub's login without a company. Should that second step fail, the next
 * call is refused by the admission anyway, and a repeat ends what stayed. Another company's Projeto
 * is `NOT_FOUND`, nothing taken or ended (S6). Answers the Projetos whose row it took.
 */
export async function revokeAccess(
  deps: AccessDeps,
  input: { person: Person; companyId: CompanyId; personId: PersonId; projectId?: ProjectId },
): Promise<ProjectId[]> {
  const { companyId, personId, projectId } = input
  const email = await deps.database.installationRead((tx) => deps.identity.addressOf(tx, personId))
  const taken = await deps.identity.libraryCommand(scopeOf(input), async (tx) => {
    await admittedManager(deps, tx, input)
    if (projectId !== undefined) await liveProject(tx, { companyId, projectId })
    if (email !== undefined)
      await deps.identity.cancelAppInvitations(tx, { companyId, email, projectId })
    return takeAccess(tx, { companyId, personId, projectId })
  })
  // A revoke repeated after its sessions failed to end finds no row, and ends them still.
  await endSessions(deps, { projectIds: projectId === undefined ? taken : [projectId], personId })
  return taken
}

/** The people from outside the company who use its apps, each with every app, for any member. */
export function readCompanyAccess(
  deps: AccessDeps,
  input: { person: Person; companyId: CompanyId },
  page: string | undefined,
) {
  return deps.database.read(scopeOf(input), async (tx) => {
    const { companyId } = input
    const personId = input.person.id
    await deps.identity.admitMember({ tx, personId, companyId, action: 'readAppAccess' })
    const members = (await deps.identity.companyMembersOf(tx, companyId)).map((one) => one.personId)
    const key = pageKey(page, PersonIdSchema)
    const live = and(
      eq(appAccess.companyId, companyId),
      notInArray(appAccess.personId, members),
      isNull(project.deletingSince),
    )
    const people = await tx
      .selectDistinct({ personId: appAccess.personId })
      .from(appAccess)
      .innerJoin(project, eq(project.id, appAccess.projectId))
      .where(
        and(
          live,
          after(sql`${appAccess.personId}`, key, (id) => sql`${id}`),
        ),
      )
      .orderBy(asc(appAccess.personId))
      .limit(PAGE_SIZE + 1)
    const listed = pageOf(people, (row) => row.personId)
    const ids = listed.rows.map((row) => PersonIdSchema.parse(row.personId))
    const apps = await tx
      .select({
        personId: appAccess.personId,
        projectId: appAccess.projectId,
        projectName: project.name,
        role: appAccess.role,
      })
      .from(appAccess)
      .innerJoin(project, eq(project.id, appAccess.projectId))
      .where(and(live, inArray(appAccess.personId, ids)))
      .orderBy(asc(project.name), asc(project.id))
    const labels = await labelsOf(deps, tx, apps)
    const named = await deps.identity.peopleNamed(tx, ids)
    return {
      people: ids.flatMap((id): CompanyAppPerson[] => {
        const person = named.get(id)
        if (person === undefined) return []
        const own = apps.filter((app) => app.personId === id)
        return [
          {
            ...person,
            apps: own.map((app) => ({
              projectId: ProjectIdSchema.parse(app.projectId),
              projectName: app.projectName,
              role: app.role,
              roleLabel:
                app.role === null ? null : (labels.get(`${app.projectId}:${app.role}`) ?? null),
            })),
          },
        ]
      }),
      next: listed.next,
    }
  })
}

async function labelsOf(
  deps: AccessDeps,
  tx: ReadTx,
  rows: readonly Pick<typeof appAccess.$inferSelect, 'projectId'>[],
) {
  const labels = new Map<string, string>()
  for (const projectId of new Set(rows.map((row) => row.projectId))) {
    const { roles } = await deps.publishedRolesOf(tx, ProjectIdSchema.parse(projectId))
    for (const role of roles) labels.set(`${projectId}:${role.name}`, role.label)
  }
  return labels
}

/** The apps the person uses, from any company, for the Hub of someone in no company (F1). */
export function readMyApps(deps: AccessDeps, person: Person) {
  return appsOfPerson(deps, person.id)
}
