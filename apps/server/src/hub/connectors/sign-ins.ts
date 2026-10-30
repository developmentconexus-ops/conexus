import { createHash, randomBytes, randomUUID } from 'node:crypto'
import type { AccountOf, Native } from '@conexus/connectors'
import { authorizeUrl, codeRequest, connectorOf } from '@conexus/connectors'
import type { Connection, SignInCompleted } from '@conexus/hub-api'
import { ConnectionId, ConnectionName, ConnectionSignInId, REDIRECT_PATH } from '@conexus/hub-api'
import { and, eq, lte, sql } from 'drizzle-orm'
import type { ReadTx } from '../../platform/database.ts'
import { violatedConstraint } from '../../platform/database.ts'
import type { FailureLog } from '../../platform/failure.ts'
import { Failure } from '../../platform/failure.ts'
import { Credential, open, seal } from '../../platform/seal.ts'
import { Secret } from '../../platform/secret.ts'
import type { OAuthConnector } from './apps.ts'
import { appKeysOf, isOAuth } from './apps.ts'
import type { Deps, Viewer } from './rows.ts'
import { admitted, columns, ofCompany, scopeOf, sealContext, viewOf } from './rows.ts'
import { connection, connectionSignIn } from './tables.ts'
import { GRANT_DEADLINE_MS, sealTokens } from './tokens.ts'

/** How long a started authorization waits for its code (decision 0049's ten minutes). */
const SIGN_IN_SECONDS = 600

type SignIn = Readonly<{
  id: ConnectionSignInId
  companyId: Viewer['companyId']
  personId: Viewer['person']['id']
  connector: OAuthConnector
}>

/** What the verifier's seal is bound to: the row, the company, the person and the connector (S32). */
function signInContext(signIn: SignIn) {
  return {
    purpose: 'connection-sign-in',
    rowId: signIn.id,
    companyId: signIn.companyId,
    personId: signIn.personId,
    kind: signIn.connector.auth.kind,
    provider: signIn.connector.id,
  } as const
}

function oauthConnectorOf(id: string): OAuthConnector {
  const connector = connectorOf(id)
  if (connector === undefined || !isOAuth(connector)) throw new Failure('CONNECTOR_UNKNOWN')
  return connector
}

function redirectUriOf(deps: Deps): string {
  return `${deps.publicOrigin}${REDIRECT_PATH}`
}

/** A first link's name is free in the company, by the same rule as the index (case and accents ignored as the ICU collation does). */
async function assertNameFree(tx: ReadTx, viewer: Viewer, connectorId: string, name: string) {
  const [taken] = await tx
    .select({ id: connection.id })
    .from(connection)
    .where(
      and(
        eq(connection.companyId, viewer.companyId),
        eq(connection.connectorId, connectorId),
        sql`lower(${connection.name} collate "und-x-icu") = lower(${name} collate "und-x-icu")`,
      ),
    )
  if (taken !== undefined) throw new Failure('CONNECTION_NAME_TAKEN')
}

type Target = Readonly<
  | { connector: OAuthConnector; name: string; connectionId: null; revision: null }
  | { connector: OAuthConnector; name: null; connectionId: ConnectionId; revision: number }
>

async function targetOf(
  tx: ReadTx,
  input: Viewer & ({ connector: string; name: string } | { connectionId: ConnectionId }),
): Promise<Target> {
  if ('connector' in input) {
    const connector = oauthConnectorOf(input.connector)
    await assertNameFree(tx, input, connector.id, input.name)
    return { connector, name: input.name, connectionId: null, revision: null }
  }
  const [row] = await tx
    .select({ connector: connection.connectorId, revision: connection.revision })
    .from(connection)
    .where(ofCompany(input, input.connectionId))
  if (row === undefined) throw new Failure('CONNECTION_NOT_FOUND')
  const connector = oauthConnectorOf(row.connector)
  return { connector, name: null, connectionId: input.connectionId, revision: row.revision }
}

/**
 * Starts an authorization (criterion 6): a new connection by its name, or Conectar de novo on one
 * (`connectionId`, with its revision now). The PKCE verifier is sealed to its row for ten minutes;
 * the person's expired ones leave (S22). Nothing is called: the address is only built.
 */
export async function startSignIn(
  deps: Deps,
  input: Viewer & ({ connector: string; name: string } | { connectionId: ConnectionId }),
) {
  const named = 'name' in input ? ConnectionName.safeParse(input.name) : null
  if (named?.success === false) throw new Failure('CONNECTION_NAME_INVALID')
  const given = named === null ? input : { ...input, name: named.data }
  return deps.database.command(scopeOf(input), async (tx) => {
    await admitted(deps, tx, input, 'manageConnections')
    const target = await targetOf(tx, given)
    const { connector } = target
    const app = appKeysOf(deps.apps, connector)
    const verifier = randomBytes(32).toString('base64url')
    const challenge = createHash('sha256').update(verifier).digest('base64url')
    const signIn = {
      id: ConnectionSignInId.parse(randomUUID()),
      companyId: input.companyId,
      personId: input.person.id,
      connector,
    }
    const sealed = seal(deps.sealKeys, signInContext(signIn), Credential.parse(verifier))
    await tx
      .delete(connectionSignIn)
      .where(
        and(
          eq(connectionSignIn.companyId, input.companyId),
          eq(connectionSignIn.personId, input.person.id),
          lte(connectionSignIn.expiresAt, sql`statement_timestamp()`),
        ),
      )
    await tx.insert(connectionSignIn).values({
      id: signIn.id,
      companyId: signIn.companyId,
      personId: signIn.personId,
      connectorId: connector.id,
      connectionId: target.connectionId,
      name: target.name,
      connectionRevision: target.revision,
      sealed: Buffer.from(sealed.blob),
      keyId: sealed.keyId,
      expiresAt: sql`statement_timestamp() + make_interval(secs => ${SIGN_IN_SECONDS})`,
    })
    const url = authorizeUrl(
      connector.auth,
      {
        clientId: app.clientId,
        redirectUri: redirectUriOf(deps),
        state: `${input.companyId}.${signIn.id}`,
        challenge,
      },
      deps.origins.get(connector.id),
    )
    return { url: url.href, connector: connector.id }
  })
}

/**
 * Takes the authorization once (S22): `DELETE … RETURNING` by its id, the person and the company,
 * so a second try, another person's, another company's or one past ten minutes finds nothing. The
 * removal commits before the provider is called (D22): any attempt spends it.
 */
async function take(deps: Deps, input: Viewer & { signInId: ConnectionSignInId }) {
  const taken = await deps.database.command(scopeOf(input), async (tx) => {
    await admitted(deps, tx, input, 'manageConnections')
    const [row] = await tx
      .delete(connectionSignIn)
      .where(
        and(
          eq(connectionSignIn.id, input.signInId),
          eq(connectionSignIn.companyId, input.companyId),
          eq(connectionSignIn.personId, input.person.id),
        ),
      )
      .returning({
        connector: connectionSignIn.connectorId,
        connectionId: connectionSignIn.connectionId,
        name: connectionSignIn.name,
        revision: connectionSignIn.connectionRevision,
        sealed: connectionSignIn.sealed,
        keyId: connectionSignIn.keyId,
        live: sql<boolean>`${connectionSignIn.expiresAt} > statement_timestamp()`,
      })
    return row
  })
  if (taken === undefined || !taken.live) throw new Failure('CONNECTION_SIGN_IN_EXPIRED')
  const connector = connectorOf(taken.connector)
  // A connector the kit no longer has, or no longer OAuth, cannot rebuild the seal's context.
  if (connector === undefined || !isOAuth(connector))
    throw new Failure('SEAL_REFUSED', { details: { reason: 'connector gone' } })
  const signIn = {
    id: input.signInId,
    companyId: input.companyId,
    personId: input.person.id,
    connector,
  }
  const verifier = open(deps.sealKeys, signInContext(signIn), {
    keyId: taken.keyId,
    blob: taken.sealed,
  })
  return { target: targetTaken(connector, taken), verifier }
}

/** The row's target, as its CHECK keeps it: a name for a first link, or a connection and its revision. */
function targetTaken(
  connector: OAuthConnector,
  taken: { connectionId: string | null; name: string | null; revision: number | null },
): Target {
  if (taken.connectionId !== null && taken.revision !== null)
    return {
      connector,
      name: null,
      connectionId: ConnectionId.parse(taken.connectionId),
      revision: taken.revision,
    }
  if (taken.name !== null) return { connector, name: taken.name, connectionId: null, revision: null }
  throw new Error('A sign-in without its target escaped connection_sign_in_target')
}

type Tokens = Readonly<{ access: string; refresh: string; expiresAt: number }>

/** What the provider said, as the log may carry it: status and code (S41). */
function statusOf(native: Native) {
  return { status: native.status, code: native.code ?? '-' }
}

/**
 * Completes an authorization (criteria 7, 8, 16, 18): taken first, then the code exchanged and the
 * account asked with no transaction open (D22), then written in one command, admitted again. A new
 * connection is NEW with its account; Conectar de novo replaces the seal and the account on the
 * revision read at the start (C38) and keeps the id and the name.
 */
export async function completeSignIn(
  deps: Deps,
  input: Viewer & {
    signInId: ConnectionSignInId
    answer: { code: string } | { refused: true }
    log: FailureLog
  },
): Promise<SignInCompleted> {
  const { target, verifier } = await take(deps, input)
  const { connector } = target
  const where = { signInId: input.signInId, connector: connector.id }
  if ('refused' in input.answer) return { result: 'CANCELLED', connector: connector.id }
  const app = appKeysOf(deps.apps, connector)
  const code = input.answer.code
  const granted = await deps.executor.grant(
    where,
    connector,
    codeRequest(connector.auth, app, {
      code,
      redirectUri: redirectUriOf(deps),
      verifier: verifier.reveal(),
    }),
    [app.clientSecret, code, verifier.reveal()],
    GRANT_DEADLINE_MS,
  )
  if (granted.kind === 'UNREACHABLE')
    return { result: 'UNREACHABLE', connector: connector.id, native: granted.native }
  if (granted.kind !== 'OK') {
    const result = granted.kind === 'GRANT_REFUSED' ? 'REFUSED' : granted.kind
    const fields = { ...where, result, ...statusOf(granted.native) }
    // The installation's app refused is the operators' to fix, as at a refresh.
    if (result === 'APP_REFUSED') input.log.error(fields, 'CONNECTOR_APP_REFUSED')
    else input.log.info(fields, 'CONNECTION_SIGN_IN_REFUSED')
    return { result, connector: connector.id, native: granted.native }
  }
  const bearer = new Secret('BearerToken', granted.accessToken)
  const who = await deps.executor.who(where, connector, bearer, deps.callDeadlineMs)
  if (who.kind === 'UNREACHABLE')
    return { result: 'UNREACHABLE', connector: connector.id, native: who.native }
  if (who.kind === 'UNREADABLE')
    return { result: 'UNREADABLE', connector: connector.id, native: who.native }
  // A first grant without a refresh token cannot be kept alive past its hours: it did not read.
  if (granted.refreshToken === null) {
    const issues = [{ path: 'refresh_token', expected: 'string', received: 'undefined' }]
    const reason = { kind: 'SHAPE' as const, issues }
    const native = { status: 200, code: null, message: null, body: null, reason }
    return { result: 'UNREADABLE', connector: connector.id, native }
  }
  const tokens = {
    access: granted.accessToken,
    refresh: granted.refreshToken,
    expiresAt: Date.now() + granted.expiresInSeconds * 1000,
  }
  const linked = await written(deps, input, target, { tokens, account: who.account })
  const event = target.connectionId === null ? 'CONNECTION_LINKED' : 'CONNECTION_RECONNECTED'
  input.log.info(
    {
      by: input.person.id,
      companyId: input.companyId,
      connectionId: linked.id,
      connector: connector.id,
    },
    event,
  )
  return { result: 'LINKED', connection: linked }
}

const ACCOUNT_KEY = 'connection_account_key'
const NAME_KEY = 'connection_name_key'

/** The unique keys a write meets, as the company reads them; the other company is never named (S10). */
function refusedBy(error: unknown): Failure | undefined {
  const constraint = violatedConstraint(error)
  if (constraint === ACCOUNT_KEY)
    return new Failure('CONNECTION_ACCOUNT_ELSEWHERE', { cause: error })
  if (constraint === NAME_KEY) return new Failure('CONNECTION_NAME_TAKEN', { cause: error })
  return undefined
}

async function written(
  deps: Deps,
  viewer: Viewer,
  target: Target,
  got: Readonly<{ tokens: Tokens; account: AccountOf }>,
): Promise<Connection> {
  const { connector } = target
  const id = target.connectionId ?? ConnectionId.parse(randomUUID())
  const sealed = sealTokens(deps, { id, companyId: viewer.companyId, connector }, got.tokens)
  const linked = {
    sealed: Buffer.from(sealed.blob),
    keyId: sealed.keyId,
    state: 'NEW' as const,
    accountRef: got.account.ref,
    accountLabel: got.account.label,
    linkedBy: viewer.person.id,
    linkedAt: sql`statement_timestamp()`,
  }
  return deps.database.command(scopeOf(viewer), async (tx) => {
    await admitted(deps, tx, viewer, 'manageConnections')
    try {
      if (target.connectionId === null) {
        await tx.insert(connection).values({
          ...linked,
          id,
          companyId: viewer.companyId,
          connectorId: connector.id,
          name: target.name,
          connectorVersion: connector.version,
          attemptKey: randomUUID(),
        })
      } else {
        const [updated] = await tx
          .update(connection)
          .set({
            ...linked,
            revision: target.revision + 1,
            refreshUntil: null,
            testedAt: null,
            testedBy: null,
            lastTest: null,
          })
          .where(and(ofCompany(viewer, id), eq(connection.revision, target.revision)))
          .returning({ id: connection.id })
        if (updated === undefined) await assertStillThere(tx, viewer, id)
      }
    } catch (error) {
      throw refusedBy(error) ?? error
    }
    const [row] = await tx.select(columns).from(connection).where(ofCompany(viewer, id))
    if (row === undefined) throw new Failure('CONNECTION_NOT_FOUND')
    return viewOf(row)
  })
}

/** Conectar de novo wrote nothing: the connection left (NOT_FOUND) or changed meanwhile, as another Conectar de novo (EXPIRED). */
async function assertStillThere(tx: ReadTx, viewer: Viewer, id: ConnectionId): Promise<never> {
  const [row] = await tx.select({ id: connection.id }).from(connection).where(ofCompany(viewer, id))
  throw new Failure(row === undefined ? 'CONNECTION_NOT_FOUND' : 'CONNECTION_SIGN_IN_EXPIRED')
}
