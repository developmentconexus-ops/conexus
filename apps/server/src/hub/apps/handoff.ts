import { createHash, randomBytes } from 'node:crypto'
import { Manifest } from '@conexus/app-contract'
import type { AppCall, AppCaller, AppHost, Person } from '@conexus/hub-api'
import {
  APP_SESSION_HEADER,
  AppSessionToken,
  AppVersionId,
  appCheckLogin,
  appCheckWorkerOf,
  appHostOf,
  appLogin,
  appOfHost,
  appWorkerOf,
  CompanyId,
  HANDOFF_PATH,
  HANDOFF_SECONDS,
  PersonId,
  ProjectId,
} from '@conexus/hub-api'
import { and, eq, gt, sql } from 'drizzle-orm'
import type { AppsDomain } from '../../platform/config.ts'
import type { Database, ReadTx } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import { COMPANY_DATABASE } from '../../platform/neon.ts'
import type { IdentityPorts } from '../identity/public.ts'
import type { ProjectPorts } from '../projects/public.ts'
import type { CallEnvironment } from './tables.ts'
import { app, appSession, appVersion, checkSession, handoff } from './tables.ts'

export type AppDeps = {
  database: Database
  identity: IdentityPorts
  projects: ProjectPorts
  appsDomain: AppsDomain
}

/** A one-use secret of the app's door: 32 random bytes, as the contract's `DoorSecret` reads them. */
export function secret(): string {
  return randomBytes(32).toString('base64url')
}

/** Only this leaves for the database: a copy of it opens no app (security S22). */
export function hashOf(value: string): string {
  return createHash('sha256').update(value).digest('base64url')
}

/**
 * Gives a person of the company, or one given its app, a pass to the app on the host, bound to the
 * browser by the hash its binding cookie holds; the host says the environment. An unknown host, an
 * outsider and a company being deleted get the same not-found (security S10); the Hub session the
 * pass hangs from is the request's own.
 */
async function createHandoff(
  deps: AppDeps,
  input: { person: Person; sessionToken: string; host: AppHost; binding: string },
) {
  const { label, environment } = appOfHost(input.host)
  const found = await deps.projects.projectOfHost(label)
  if (found === undefined) throw new Failure('NOT_FOUND', { details: { reason: 'NO_HOST' } })
  const admitted = await deps.projects.admitToApp({
    personId: input.person.id,
    ...found,
    environment,
  })
  if (admitted.kind !== 'ADMITTED') {
    const reason = admitted.kind === 'REFUSED' ? admitted.reason : 'NO_PROJECT'
    throw new Failure('NOT_FOUND', { details: { reason } })
  }
  const code = secret()
  await deps.database.installation(async (tx) => {
    const hubSessionId = await deps.identity.liveHubSession(tx, { token: input.sessionToken })
    if (hubSessionId === undefined) throw new Failure('SESSION_REQUIRED')
    await tx.insert(handoff).values({
      codeHash: hashOf(code),
      bindingHash: input.binding,
      hostLabel: input.host,
      personId: input.person.id,
      ...found,
      hubSessionId,
      expiresAt: sql`statement_timestamp() + make_interval(secs => ${HANDOFF_SECONDS})`,
    })
  })
  const location = new URL(
    HANDOFF_PATH,
    `https://${appHostOf({ label: input.host, appsDomain: deps.appsDomain })}`,
  )
  location.searchParams.set('code', code)
  return { location: location.href, ...found }
}

/**
 * Trades a pass for an app session in one transaction. The delete is the one decision: a pass of
 * another browser, another host or past its 60 s matches no row and stays, so its owner can still
 * use it; two redemptions at once meet on the row, and one of them finds nothing (code C65).
 */
function redeemHandoff(deps: AppDeps, input: { host: AppHost; code: string; binding: string }) {
  return deps.database.installation(async (tx) => {
    const [taken] = await tx
      .delete(handoff)
      .where(
        and(
          eq(handoff.codeHash, hashOf(input.code)),
          eq(handoff.bindingHash, hashOf(input.binding)),
          eq(handoff.hostLabel, input.host),
          gt(handoff.expiresAt, sql`statement_timestamp()`),
        ),
      )
      .returning()
    if (taken === undefined) throw new Failure('APP_HANDOFF_INVALID')
    const session = secret()
    const { personId, companyId, projectId, hubSessionId } = taken
    await tx.insert(appSession).values({
      tokenHash: hashOf(session),
      hostLabel: taken.hostLabel,
      personId,
      companyId,
      projectId,
      hubSessionId,
    })
    return { session, companyId, projectId }
  })
}

/**
 * The session a token opens on this host: an app session while the Hub session it lives in does
 * (security S18), or a conference's until it ends or expires.
 */
async function sessionOf(deps: AppDeps, tx: ReadTx, input: { tokenHash: string; host: AppHost }) {
  function onHost(table: typeof appSession | typeof checkSession) {
    return and(eq(table.tokenHash, input.tokenHash), eq(table.hostLabel, input.host))
  }
  const [row] = await tx.select().from(appSession).where(onHost(appSession))
  if (row !== undefined) {
    const live = await deps.identity.liveHubSession(tx, { id: row.hubSessionId })
    return live === undefined ? undefined : { row, check: false }
  }
  const before = gt(checkSession.expiresAt, sql`statement_timestamp()`)
  const [check] = await tx
    .select()
    .from(checkSession)
    .where(and(onHost(checkSession), before))
  return check === undefined ? undefined : { row: check, check: true }
}

/**
 * Checks one call to an app: its session on this host, then the person's admission and the
 * Projeto, read now, so a removal or a deletion refuses the next call (S8, S13). The host says the
 * environment, as it did when the session was made there; a conference's session says `check`,
 * admitted as the Prévia is. The app sees only the caller; the dispatcher also learns the version
 * the session gets and the database its run login reaches, or that the Projeto runs the example.
 */
type Admitted = Readonly<{
  ids: { companyId: CompanyId; projectId: ProjectId }
  caller: AppCaller
  environment: CallEnvironment
}>

async function admitCall(
  deps: AppDeps,
  input: { host: AppHost; headers: Headers },
): Promise<Admitted> {
  const token = AppSessionToken.safeParse(input.headers.get(APP_SESSION_HEADER))
  if (!token.success) throw new Failure('APP_SESSION_INVALID', { details: { reason: 'NO_TOKEN' } })
  const found = await deps.database.installationRead(async (tx) => {
    const session = await sessionOf(deps, tx, { tokenHash: hashOf(token.data), host: input.host })
    if (session === undefined) return undefined
    const personId = PersonId.parse(session.row.personId)
    const personName = await deps.identity.personNameOf(tx, personId)
    if (personName === undefined) return undefined
    const ids = {
      companyId: CompanyId.parse(session.row.companyId),
      projectId: ProjectId.parse(session.row.projectId),
    }
    return { personId, personName, ids, check: session.check }
  })
  if (found === undefined) throw new Failure('APP_SESSION_INVALID')
  const { ids } = found
  // The host names its Projeto now: a Projeto deleted and created again under the same name is
  // another app, so the old session goes and the person passes through the Hub again (code C26).
  const { label, environment: hosted } = appOfHost(input.host)
  const environment: CallEnvironment = found.check ? 'check' : hosted
  const current = await deps.projects.projectOfHost(label)
  if (current === undefined) throw new Failure('APP_NOT_FOUND', { details: ids })
  if (current.projectId !== ids.projectId) {
    await deps.database.installation((tx) =>
      tx.delete(appSession).where(eq(appSession.tokenHash, hashOf(token.data))),
    )
    throw new Failure('APP_SESSION_INVALID', { details: { ...ids, reason: 'PROJECT_REPLACED' } })
  }
  const admitted = await deps.projects.admitToApp({
    ...{ personId: found.personId, ...ids },
    environment: environment === 'check' ? 'preview' : environment,
  })
  switch (admitted.kind) {
    case 'REFUSED':
      throw new Failure('APP_ACCESS_REFUSED', { details: { ...ids, reason: admitted.reason } })
    case 'NOT_FOUND':
      throw new Failure('APP_NOT_FOUND', { details: ids })
    case 'ADMITTED': {
      const { personId, personName } = found
      const { projectName, access } = admitted
      const caller = { personId, personName, projectId: ids.projectId, projectName, access }
      return { ids, caller, environment }
    }
    default:
      return admitted satisfies never
  }
}

async function checkCall(
  deps: AppDeps,
  input: { host: AppHost; headers: Headers },
): Promise<AppCall> {
  const { ids, caller, environment } = await admitCall(deps, input)
  return callTo(deps, { ...ids, caller, environment })
}

/**
 * What the connectors' door needs of an app call: who, and the version the session gets with the
 * connectors it declared; or that it is a conference's, which reads no connector.
 */
export type ConnectorCall =
  | Readonly<{
      kind: 'CALL'
      ids: { companyId: CompanyId; projectId: ProjectId }
      caller: AppCaller
      versionId: AppVersionId
      manifest: Manifest
    }>
  | Readonly<{ kind: 'CHECK' }>

/**
 * `checkCall`'s admission, then the version the host gets and its manifest in one read (the
 * published one on the app's host, the Prévia's on its own): the connectors check the grant against
 * it. A conference's session stops before any read.
 */
async function connectorCall(
  deps: AppDeps,
  input: { host: AppHost; headers: Headers },
): Promise<ConnectorCall> {
  const { ids, caller, environment } = await admitCall(deps, input)
  switch (environment) {
    case 'check':
      return { kind: 'CHECK' }
    case 'preview':
    case 'published':
      break
    default:
      return environment satisfies never
  }
  const scope = { kind: 'COMPANY', companyId: ids.companyId, personId: caller.personId } as const
  const [row] = await deps.database.read(scope, (tx) =>
    tx
      .select({ id: appVersion.id, manifest: appVersion.manifest })
      .from(app)
      .innerJoin(
        appVersion,
        eq(appVersion.id, environment === 'published' ? app.publishedVersionId : app.liveVersionId),
      )
      .where(eq(app.projectId, ids.projectId)),
  )
  if (row === undefined)
    throw new Failure(environment === 'published' ? 'APP_NOT_PUBLISHED' : 'APP_NOT_FOUND', {
      details: ids,
    })
  return {
    kind: 'CALL',
    ids,
    caller,
    versionId: AppVersionId.parse(row.id),
    manifest: Manifest.parse(row.manifest),
  }
}

/** The address the app's run login, or the conference's, reaches the company's database at. */
async function runDatabase(
  deps: AppDeps,
  tx: ReadTx,
  input: { companyId: CompanyId; login: string },
) {
  const ready = await deps.projects.readyDatabaseOf(tx, input.companyId)
  if (ready?.host == null) {
    throw new Failure('INTERNAL_UNEXPECTED', { details: { reason: 'LIVE_WITHOUT_HOST' } })
  }
  return { host: ready.host, database: COMPANY_DATABASE, login: input.login }
}

/**
 * The Worker of the version the host gets and the run login's database: the published one on the
 * app's host, the Prévia's on its own, the Projeto's conference Worker and test schema in a
 * conference. The app's host before the first Publicar is refused; the Prévia's before the first
 * version gets the example app.
 */
function callTo(
  deps: AppDeps,
  input: {
    companyId: CompanyId
    projectId: ProjectId
    caller: AppCaller
    environment: CallEnvironment
  },
): Promise<AppCall> {
  const { companyId, projectId, caller, environment } = input
  const scope = { kind: 'COMPANY', companyId, personId: caller.personId } as const
  return deps.database.read(scope, async (tx): Promise<AppCall> => {
    switch (environment) {
      case 'check': {
        const login = appCheckLogin(projectId).runLogin
        const database = await runDatabase(deps, tx, { companyId, login })
        return { caller, version: { worker: appCheckWorkerOf(projectId) }, database }
      }
      case 'preview':
      case 'published':
        break
      default:
        return environment satisfies never
    }
    const [row] = await tx
      .select({ preview: app.liveVersionId, published: app.publishedVersionId })
      .from(app)
      .where(eq(app.projectId, projectId))
    const versionId = environment === 'published' ? row?.published : row?.preview
    if (versionId == null) {
      if (environment === 'published') {
        throw new Failure('APP_NOT_PUBLISHED', { details: { companyId, projectId } })
      }
      return { caller, version: { example: true }, database: null }
    }
    const login = appLogin(projectId).runLogin
    const database = await runDatabase(deps, tx, { companyId, login })
    return { caller, version: { worker: appWorkerOf(AppVersionId.parse(versionId)) }, database }
  })
}

/**
 * Ends a person's sessions in a Projeto's app, their conferences' too, once their access is taken
 * (security S13), after the commit and through the Hub's login without a company, as `checkCall`
 * ends a replaced one.
 */
export async function endAppSessions(
  deps: { database: Database },
  ids: { projectId: ProjectId; personId: PersonId },
): Promise<void> {
  await deps.database.installation(async (tx) => {
    for (const table of [appSession, checkSession]) {
      await tx
        .delete(table)
        .where(and(eq(table.projectId, ids.projectId), eq(table.personId, ids.personId)))
    }
  })
}

/** The door's acts, each bound to its dependencies. */
export function createAppDoor(deps: AppDeps) {
  return Object.freeze({
    admitCall: (input: Parameters<typeof admitCall>[1]) => admitCall(deps, input),
    createHandoff: (input: Parameters<typeof createHandoff>[1]) => createHandoff(deps, input),
    redeemHandoff: (input: Parameters<typeof redeemHandoff>[1]) => redeemHandoff(deps, input),
    checkCall: (input: Parameters<typeof checkCall>[1]) => checkCall(deps, input),
    connectorCall: (input: Parameters<typeof connectorCall>[1]) => connectorCall(deps, input),
  })
}
export type AppDoor = ReturnType<typeof createAppDoor>
