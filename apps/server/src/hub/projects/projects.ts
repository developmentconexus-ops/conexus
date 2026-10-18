import { randomBytes } from 'node:crypto'
import type { CompanyId, Person, Project, ProjectName } from '@conexus/hub-api'
import { appHostOf, HostLabel, hostLabelOf, PAGE_SIZE, ProjectId } from '@conexus/hub-api'
import { and, asc, eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import type { AppsDomain } from '../../platform/config.ts'
import type { CommandTx, Database, Scope } from '../../platform/database.ts'
import { databaseFailure, transactionLock, violatedConstraint } from '../../platform/database.ts'
import type { FailureLog } from '../../platform/failure.ts'
import { Failure, logFailure } from '../../platform/failure.ts'
import type { NeonProjects } from '../../platform/neon.ts'
import { after, pageKey, pageOf } from '../../platform/pages.ts'
import type { IdentityPorts } from '../identity/public.ts'
import { claimDatabase, markReady, prepareDatabase, releaseClaim } from './company-database.ts'
import { companyDatabase, project } from './tables.ts'

type Deps = {
  database: Database
  identity: IdentityPorts
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

/**
 * The Project as a viewer with this role sees it: whether they may delete it is the Hub's answer
 * (code C26), and its app's address the host its label names under the apps' domain.
 */
function viewOf(deps: Deps, input: { row: ProjectRow; mayDelete: boolean }): Project {
  const { hostLabel } = input.row
  const address =
    hostLabel === null ? null : appHostOf({ label: hostLabel, appsDomain: deps.appsDomain })
  return { ...summaryOf(input.row), mayDelete: input.mayDelete, address }
}

/** The address a new Project is born with: its name and the company's nickname (decision 0024). */
async function hostLabelFor(deps: Deps, tx: CommandTx, input: Creation): Promise<HostLabel> {
  const nickname = await deps.identity.companyNicknameOf(tx, input.companyId)
  if (nickname === null) throw new Failure('COMPANY_SETUP_PENDING')
  const label = hostLabelOf({ name: input.name, nickname })
  if (label === undefined) throw new Failure('PROJECT_NAME_NO_ADDRESS')
  return label
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
  const mayDelete = deps.identity.allows(admitted.role, 'deleteProject')
  const replay = await replayOf(tx, { ...input })
  if (replay !== undefined) return { kind: 'REPLAY', mayDelete, row: replay } as const
  return { kind: 'NEW', mayDelete, hostLabel: await hostLabelFor(deps, tx, input) } as const
}

/**
 * Creates a Project. A company with no database reserves the right to prepare it in a first
 * transaction, calls Neon with none open, and records the database with the Project in a second
 * (data D22): a claim that ends without the Project lets the next attempt find the database by name.
 */
async function create(deps: Deps, input: Creation): Promise<Created> {
  const { database } = deps
  const scope = scopeOf(input.person, input.companyId)
  const started = await database.command(scope, async (tx) => {
    const entered = await enterCreation(deps, tx, input)
    const { mayDelete } = entered
    if (entered.kind === 'REPLAY') {
      return { kind: 'DONE', created: false, row: entered.row, mayDelete } as const
    }
    if ((await claimDatabase(tx, input.companyId)) === 'CLAIMED') {
      return { kind: 'CLAIMED', mayDelete } as const
    }
    const row = await insertProject(tx, { ...input, hostLabel: entered.hostLabel })
    return { kind: 'DONE', created: true, row, mayDelete } as const
  })
  if (started.kind === 'DONE') {
    const { row, mayDelete, created } = started
    return { project: viewOf(deps, { row, mayDelete }), created, databaseCreated: false }
  }
  const prepared = await prepareDatabase(deps.neon, input.companyId)
  if (prepared.kind !== 'READY') {
    // A refusal leaves nothing in Neon, so the next attempt may go at once; silence may have left a project.
    if (prepared.kind === 'REFUSED')
      await database.command(scope, (tx) => releaseClaim(tx, input.companyId))
    throw new Failure('COMPANY_DATABASE_UNAVAILABLE')
  }
  try {
    return await database.command(scope, async (tx) => {
      const entered = await enterCreation(deps, tx, input)
      const { mayDelete } = entered
      if (entered.kind === 'REPLAY') {
        return {
          project: viewOf(deps, { row: entered.row, mayDelete }),
          created: false,
          databaseCreated: false,
        }
      }
      const databaseCreated = await markReady(tx, {
        companyId: input.companyId,
        neonProjectId: prepared.id,
      })
      const row = await insertProject(tx, { ...input, hostLabel: entered.hostLabel })
      return { project: viewOf(deps, { row, mayDelete }), created: true, databaseCreated }
    })
  } catch (error) {
    // The project in Neon stays, and the next attempt finds it by name instead of waiting out the claim.
    await database
      .command(scope, (tx) => releaseClaim(tx, input.companyId))
      .catch((releaseError: unknown) => logFailure(deps.log, databaseFailure(releaseError)))
    throw error
  }
}

type OfProject = { person: Person; companyId: CompanyId; projectId: ProjectId }

/** Deletes a Project for an owner or administrator who typed its name; the company's database stays. */
function remove(deps: Deps, input: OfProject & { name: ProjectName }) {
  const scope = scopeOf(input.person, input.companyId)
  return deps.database.command(scope, async (tx) => {
    await deps.identity.admitMember({
      tx,
      personId: input.person.id,
      companyId: input.companyId,
      action: 'deleteProject',
    })
    const [row] = await tx
      .select({ name: project.name })
      .from(project)
      .where(and(eq(project.id, input.projectId), eq(project.companyId, input.companyId)))
    if (row === undefined) throw new Failure('NOT_FOUND')
    if (row.name !== input.name) throw new Failure('PROJECT_NAME_MISMATCH')
    // The delete takes the row's lock itself, for the company's grant has no UPDATE: a second
    // deletion of the Project waits for the first and finds nothing (code C65).
    const deleted = await tx
      .delete(project)
      .where(and(eq(project.id, input.projectId), eq(project.companyId, input.companyId)))
      .returning({ id: project.id })
    if (deleted.length === 0) throw new Failure('NOT_FOUND')
  })
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
      .where(and(eq(project.id, input.projectId), eq(project.companyId, input.companyId)))
    if (row === undefined) throw new Failure('NOT_FOUND')
    const mayDelete = deps.identity.allows(admitted.role, 'deleteProject')
    return { project: viewOf(deps, { row: ProjectRow.parse(row), mayDelete }) }
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
    const key = pageKey(input.page)
    const rows = await tx
      .select(columns)
      .from(project)
      .where(
        and(
          eq(project.companyId, companyId),
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
