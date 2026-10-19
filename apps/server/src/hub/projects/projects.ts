import { randomBytes } from 'node:crypto'
import type { CompanyId, Person, Project, ProjectName, Role } from '@conexus/hub-api'
import { appHostOf, HostLabel, hostLabelOf, PAGE_SIZE, ProjectId } from '@conexus/hub-api'
import { and, asc, eq, isNotNull, isNull, sql } from 'drizzle-orm'
import { z } from 'zod'
import type { AppsDomain } from '../../platform/config.ts'
import type { CommandTx, Database, ReadTx, Scope } from '../../platform/database.ts'
import { databaseFailure, transactionLock, violatedConstraint } from '../../platform/database.ts'
import type { FailureLog } from '../../platform/failure.ts'
import { Failure, logFailure } from '../../platform/failure.ts'
import type { NeonProjects } from '../../platform/neon.ts'
import { after, pageKey, pageOf } from '../../platform/pages.ts'
import type { IdentityPorts } from '../identity/public.ts'
import { claimDatabase, markReady, prepareDatabase, releaseClaim } from './company-database.ts'
import { companyDatabase, project } from './tables.ts'

/**
 * What deleting a Projeto asks of its app (code C4): Projects names the port, and `main.ts` hands
 * it the apps' own, made before either subject exists.
 */
export type AppRemoval = {
  claimForDeletion(
    tx: CommandTx,
    ids: { companyId: CompanyId; projectId: ProjectId },
  ): Promise<void>
  removeProjectApp(input: {
    scope: Scope
    companyId: CompanyId
    projectId: ProjectId
  }): Promise<'DONE' | 'LEFT'>
}

/**
 * What deleting a Projeto asks of the Builder (code C4): its conversations' threads and memory go
 * before its row, which takes their index with it (data D17).
 */
export type ProjectConversationRelease = (scope: {
  companyId: CompanyId
  projectId: ProjectId
}) => Promise<void>

type Deps = {
  database: Database
  identity: IdentityPorts
  appRemoval: AppRemoval
  releaseConversations: ProjectConversationRelease
  neon: NeonProjects
  log: FailureLog
  appsDomain: AppsDomain
}

const NAME_KEY = 'project_company_name_key'
const ADDRESS_KEY = 'project_host_label_key'
const ProjectRow = z.object({
  id: ProjectId,
  name: z.string().min(1),
  createdAt: z.date(),
  hostLabel: HostLabel.nullable(),
})
type ProjectRow = z.infer<typeof ProjectRow>

const columns = {
  id: project.id,
  name: project.name,
  createdAt: project.createdAt,
  hostLabel: project.hostLabel,
}

function scopeOf(person: Person, companyId: CompanyId): Scope {
  return { kind: 'COMPANY', companyId, personId: person.id }
}

function summaryOf(row: ProjectRow) {
  return { id: row.id, name: row.name, createdAt: row.createdAt.toISOString() }
}

type Rights = { mayDelete: boolean; mayManageVersions: boolean }

/** What a viewer with this role may do to a Project: the Hub's answer, never the screen's (code C26). */
function rightsOf(deps: Deps, role: Role): Rights {
  return {
    mayDelete: deps.identity.allows(role, 'deleteProject'),
    mayManageVersions: deps.identity.allows(role, 'manageAppVersions'),
  }
}

/** The Project as a viewer with these rights sees it, its app's address under the apps' domain. */
function viewOf(deps: Deps, input: { row: ProjectRow; rights: Rights }): Project {
  const { hostLabel } = input.row
  const address =
    hostLabel === null ? null : appHostOf({ label: hostLabel, appsDomain: deps.appsDomain })
  return { ...summaryOf(input.row), ...input.rights, address }
}

/**
 * The address a new Project is born with, its name and the company's nickname (decision 0024), and
 * the nickname, which also names the company's Neon project (0048).
 */
async function hostLabelFor(deps: Deps, tx: CommandTx, input: Creation) {
  const nickname = await deps.identity.companyNicknameOf(tx, input.companyId)
  if (nickname === null) throw new Failure('COMPANY_SETUP_PENDING')
  const hostLabel = hostLabelOf({ name: input.name, nickname })
  if (hostLabel === undefined) throw new Failure('PROJECT_NAME_NO_ADDRESS')
  return { hostLabel, nickname }
}

/**
 * A name or an address the company already holds is refused by its unique index, also between two
 * at once: "Ação" after "Acao" is another name with the same address.
 */
async function insertProject(
  tx: CommandTx,
  input: { companyId: CompanyId; name: ProjectName; attemptKey: string; hostLabel: HostLabel },
): Promise<ProjectRow> {
  const id = ProjectId.parse(randomBytes(16).toString('hex'))
  try {
    const [row] = await tx
      .insert(project)
      .values({ id, ...input, createdAt: sql`statement_timestamp()` })
      .returning(columns)
    return ProjectRow.parse(row)
  } catch (error) {
    const violated = violatedConstraint(error)
    if (violated === NAME_KEY) throw new Failure('PROJECT_NAME_TAKEN', { cause: error })
    if (violated === ADDRESS_KEY) throw new Failure('PROJECT_ADDRESS_TAKEN', { cause: error })
    throw error
  }
}

/** The Project this attempt already made; the same key with another name is another request (code C37). */
async function replayOf(
  tx: CommandTx,
  input: { companyId: CompanyId; name: ProjectName; attemptKey: string },
): Promise<ProjectRow | undefined> {
  const [row] = await tx
    .select(columns)
    .from(project)
    .where(and(eq(project.companyId, input.companyId), eq(project.attemptKey, input.attemptKey)))
  if (row === undefined) return undefined
  if (row.name !== input.name) throw new Failure('IDEMPOTENCY_CONFLICT')
  return ProjectRow.parse(row)
}

type Creation = { person: Person; companyId: CompanyId; name: ProjectName; attemptKey: string }
type Created = { project: Project; created: boolean; databaseCreated: boolean }

/**
 * The company's lock, the attempt's, then the admission: the order every creation keeps, so two at
 * once, or a creation and a deletion of the company, meet in one place (code C65, S8). A new attempt
 * learns its address here, before any call to Neon.
 */
async function enterCreation(deps: Deps, tx: CommandTx, input: Creation) {
  await deps.identity.lockCompany(tx, input.companyId)
  await transactionLock(tx, `conexus.project:${input.companyId}:${input.attemptKey}`)
  const admitted = await deps.identity.admitMember({
    tx,
    personId: input.person.id,
    companyId: input.companyId,
    action: 'createProject',
  })
  const rights = rightsOf(deps, admitted.role)
  const replay = await replayOf(tx, { ...input })
  if (replay !== undefined) return { kind: 'REPLAY', rights, row: replay } as const
  return { kind: 'NEW', rights, ...(await hostLabelFor(deps, tx, input)) } as const
}

/**
 * Creates a Project. A company with no database reserves the right to prepare it in a first
 * transaction, calls Neon with none open, and records the database with the Project in a second
 * (data D22): a claim that ends without the Project lets the next attempt find the database by its key.
 */
async function create(deps: Deps, input: Creation): Promise<Created> {
  const { database } = deps
  const scope = scopeOf(input.person, input.companyId)
  const started = await database.command(scope, async (tx) => {
    const entered = await enterCreation(deps, tx, input)
    const { rights } = entered
    if (entered.kind === 'REPLAY') {
      return { kind: 'DONE', created: false, row: entered.row, rights } as const
    }
    if ((await claimDatabase(tx, input.companyId)) === 'CLAIMED') {
      return { kind: 'CLAIMED', rights, nickname: entered.nickname } as const
    }
    const row = await insertProject(tx, { ...input, hostLabel: entered.hostLabel })
    return { kind: 'DONE', created: true, row, rights } as const
  })
  if (started.kind === 'DONE') {
    const { row, rights, created } = started
    return { project: viewOf(deps, { row, rights }), created, databaseCreated: false }
  }
  const { nickname } = started
  const prepared = await prepareDatabase(deps.neon, { companyId: input.companyId, nickname })
  if (prepared.kind !== 'READY') {
    // A refusal leaves nothing in Neon, so the next attempt may go at once; silence may have left a project.
    if (prepared.kind === 'REFUSED')
      await database.command(scope, (tx) => releaseClaim(tx, input.companyId))
    throw new Failure('COMPANY_DATABASE_UNAVAILABLE')
  }
  try {
    return await database.command(scope, async (tx) => {
      const entered = await enterCreation(deps, tx, input)
      const { rights } = entered
      if (entered.kind === 'REPLAY') {
        return {
          project: viewOf(deps, { row: entered.row, rights }),
          created: false,
          databaseCreated: false,
        }
      }
      const databaseCreated = await markReady(tx, {
        companyId: input.companyId,
        neonProjectId: prepared.id,
      })
      const row = await insertProject(tx, { ...input, hostLabel: entered.hostLabel })
      return { project: viewOf(deps, { row, rights }), created: true, databaseCreated }
    })
  } catch (error) {
    // The project in Neon stays, and the next attempt finds it by its key instead of waiting out the claim.
    await database
      .command(scope, (tx) => releaseClaim(tx, input.companyId))
      .catch((releaseError: unknown) => logFailure(deps.log, databaseFailure(releaseError)))
    throw error
  }
}

type OfProject = { person: Person; companyId: CompanyId; projectId: ProjectId }

/**
 * Deletes a Project for an owner or administrator who typed its name; the company's database stays.
 * A first transaction marks it, so every read and its app's host see it gone at once; its app's
 * Workers, schema and logins go with no transaction open (data D22), then its row. What the app's
 * removal could not finish stays marked for the repair at start; the same request resumes it.
 */
async function remove(deps: Deps, input: OfProject & { name: ProjectName }) {
  const scope = scopeOf(input.person, input.companyId)
  const ids = { companyId: input.companyId, projectId: input.projectId }
  await deps.database.command(scope, async (tx) => {
    await deps.identity.admitMember({
      tx,
      personId: input.person.id,
      companyId: input.companyId,
      action: 'deleteProject',
    })
    const [row] = await tx
      .select({ name: project.name, deletingSince: project.deletingSince })
      .from(project)
      .where(ofProject(ids))
    const marked = row !== undefined && row.deletingSince !== null
    if (row === undefined || (marked && row.name !== input.name)) throw new Failure('NOT_FOUND')
    if (row.name !== input.name) throw new Failure('PROJECT_NAME_MISMATCH')
    if (marked) return
    await deps.appRemoval.claimForDeletion(tx, ids)
    await tx
      .update(project)
      .set({ deletingSince: sql`statement_timestamp()` })
      .where(and(ofProject(ids), isNull(project.deletingSince)))
  })
  if ((await deps.appRemoval.removeProjectApp({ scope, ...ids })) === 'LEFT') return
  await finishMarkedProject(deps, { scope, ...ids })
}

function ofProject(ids: { companyId: CompanyId; projectId: ProjectId }) {
  return and(eq(project.id, ids.projectId), eq(project.companyId, ids.companyId))
}

/** The company's Projetos marked for deletion, which the repair at start finishes. */
export async function markedProjectsOf(tx: ReadTx, companyId: CompanyId): Promise<ProjectId[]> {
  const rows = await tx
    .select({ id: project.id })
    .from(project)
    .where(and(eq(project.companyId, companyId), isNotNull(project.deletingSince)))
  return rows.map(({ id }) => ProjectId.parse(id))
}

/**
 * The rest of a Projeto marked for deletion, once its app is gone: its conversations, with no
 * transaction open (data D22), then its row. Conversations the Builder could not release keep the
 * mark for the repair at start: `PROJECT_DELETION_PENDING`.
 */
export async function finishMarkedProject(
  deps: Pick<Deps, 'database' | 'releaseConversations'>,
  input: { scope: Scope; companyId: CompanyId; projectId: ProjectId },
): Promise<void> {
  const ids = { companyId: input.companyId, projectId: input.projectId }
  try {
    await deps.releaseConversations(ids)
  } catch (cause) {
    throw new Failure('PROJECT_DELETION_PENDING', { cause })
  }
  await deps.database.command(input.scope, (tx) =>
    tx.delete(project).where(and(ofProject(ids), isNotNull(project.deletingSince))),
  )
}

function get(deps: Deps, input: OfProject) {
  return deps.database.read(scopeOf(input.person, input.companyId), async (tx) => {
    const admitted = await deps.identity.admitMember({
      tx,
      personId: input.person.id,
      companyId: input.companyId,
      action: 'readProjects',
    })
    const [row] = await tx
      .select(columns)
      .from(project)
      .where(and(ofProject(input), isNull(project.deletingSince)))
    if (row === undefined) throw new Failure('NOT_FOUND')
    const rights = rightsOf(deps, admitted.role)
    return { project: viewOf(deps, { row: ProjectRow.parse(row), rights }) }
  })
}

/** The company's Projects by name, 50 a page (code C44), and whether its database is ready. */
function list(
  deps: Deps,
  input: { person: Person; companyId: CompanyId; page: string | undefined },
) {
  return deps.database.read(scopeOf(input.person, input.companyId), async (tx) => {
    const { companyId } = input
    await deps.identity.admitMember({
      tx,
      personId: input.person.id,
      companyId,
      action: 'readProjects',
    })
    const key = pageKey(input.page, ProjectId)
    const rows = await tx
      .select(columns)
      .from(project)
      .where(
        and(
          eq(project.companyId, companyId),
          isNull(project.deletingSince),
          after(sql`(${project.name}, ${project.id})`, key, (id) =>
            tx
              .select({ name: project.name, id: project.id })
              .from(project)
              .where(and(eq(project.id, id), eq(project.companyId, companyId))),
          ),
        ),
      )
      .orderBy(asc(project.name), asc(project.id))
      .limit(PAGE_SIZE + 1)
    const listed = pageOf(
      rows.map((row) => ProjectRow.parse(row)),
      (row) => row.id,
    )
    const [ready] = await tx
      .select({ companyId: companyDatabase.companyId })
      .from(companyDatabase)
      .where(and(eq(companyDatabase.companyId, companyId), eq(companyDatabase.state, 'ready')))
    return {
      projects: listed.rows.map(summaryOf),
      next: listed.next,
      databaseReady: ready !== undefined,
    }
  })
}

export function createProjectStore(deps: Deps) {
  return Object.freeze({
    list: (input: Parameters<typeof list>[1]) => list(deps, input),
    get: (input: OfProject) => get(deps, input),
    create: (input: Creation) => create(deps, input),
    remove: (input: OfProject & { name: ProjectName }) => remove(deps, input),
  })
}

export type ProjectStore = ReturnType<typeof createProjectStore>
