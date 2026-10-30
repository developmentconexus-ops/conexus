import { createHash, randomBytes, randomUUID } from 'node:crypto'
import type { AccountOf, ConnectorId, GrantAnswered } from '@conexus/connectors'
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
import { admitted, columns, ofCompany, scopeOf, viewOf } from './rows.ts'
import { connection, connectionSignIn } from './tables.ts'
import type { ConnectionTokens } from './tokens.ts'
import { GRANT_DEADLINE_MS, sealTokens, statusOf } from './tokens.ts'

/** How long a started authorization waits for its code (decision 0049's ten minutes). */
const SIGN_IN_SECONDS = 600

/** What the verifier's seal is bound to: the row, the company, the person and the connector (S32). */
function signInContext(id: ConnectionSignInId, viewer: Viewer, connector: OAuthConnector) {
  return {
    purpose: 'connection-sign-in',
    rowId: id,
    companyId: viewer.companyId,
    personId: viewer.person.id,
    kind: connector.auth.kind,
    provider: connector.id,
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

/** A first link under a free name, or Conectar de novo on a connection at the revision read when it started (C38). */
type Target =
  | Readonly<{ connector: OAuthConnector; name: string; connectionId: null; revision: null }>
  | Readonly<{
      connector: OAuthConnector
      name: null
      connectionId: ConnectionId
      revision: number
    }>

async function targetOf(
  tx: ReadTx,
  input: Viewer & ({ connector: string; name: string } | { connectionId: ConnectionId }),
): Promise<Target> {
  if ('connector' in input) {
    const connector = oauthConnectorOf(input.connector)
    // The same rule as connection_name_key: case and accents as the ICU collation compares them.
    const [taken] = await tx
      .select({ id: connection.id })
      .from(connection)
      .where(
        and(
          eq(connection.companyId, input.companyId),
          eq(connection.connectorId, connector.id),
          sql`lower(${connection.name} collate "und-x-icu") = lower(${input.name} collate "und-x-icu")`,
        ),
      )
    if (taken !== undefined) throw new Failure('CONNECTION_NAME_TAKEN')
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
 * Starts an authorization (criterion 6): a new connection by its name, or Conectar de novo on one.
 * The PKCE verifier is sealed to its row for ten minutes and the person's expired ones leave (S22).
 * Nothing is called: the address is only built, its `state` the company and the row.
 */
export async function startSignIn(
  deps: Deps,
  input: Viewer & ({ connector: string; name: string } | { connectionId: ConnectionId }),
): Promise<{ url: string; connector: ConnectorId }> {
  const named = 'name' in input ? ConnectionName.safeParse(input.name) : null
  if (named?.success === false) throw new Failure('CONNECTION_NAME_INVALID')
  const given = named === null ? input : { ...input, name: named.data }
  return deps.database.command(scopeOf(input), async (tx) => {
    await admitted(deps, tx, input, 'manageConnections')
    const target = await targetOf(tx, given)
    const { connector } = target
    const app = appKeysOf(deps.apps, connector)
    const verifier = randomBytes(32).toString('base64url')
    const id = ConnectionSignInId.parse(randomUUID())
    const sealed = seal(
      deps.sealKeys,
      signInContext(id, input, connector),
      Credential.parse(verifier),
    )
    const mine = and(
      eq(connectionSignIn.companyId, input.companyId),
      eq(connectionSignIn.personId, input.person.id),
    )
    await tx
      .delete(connectionSignIn)
      .where(and(mine, lte(connectionSignIn.expiresAt, sql`statement_timestamp()`)))
    await tx.insert(connectionSignIn).values({
      ...{ id, companyId: input.companyId, personId: input.person.id, connectorId: connector.id },
      ...{ name: target.name, connectionId: target.connectionId },
      connectionRevision: target.revision,
      sealed: Buffer.from(sealed.blob),
      keyId: sealed.keyId,
      expiresAt: sql`statement_timestamp() + make_interval(secs => ${SIGN_IN_SECONDS})`,
    })
    const challenge = createHash('sha256').update(verifier).digest('base64url')
    const url = authorizeUrl(
      connector.auth,
      {
        clientId: app.clientId,
        redirectUri: redirectUriOf(deps),
        state: `${input.companyId}.${id}`,
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
  const context = signInContext(input.signInId, input, connector)
  const verifier = open(deps.sealKeys, context, { keyId: taken.keyId, blob: taken.sealed })
  // connection_sign_in_target keeps one of the two.
  const target: Target =
    taken.connectionId !== null && taken.revision !== null
      ? {
          connector,
          name: null,
          connectionId: ConnectionId.parse(taken.connectionId),
          revision: taken.revision,
        }
      : { connector, name: String(taken.name), connectionId: null, revision: null }
  return { target, verifier }
}

type Ended = Exclude<SignInCompleted, { result: 'LINKED' | 'CANCELLED' }>

/** A refused exchange, as the screen and the log read it; the app refused is the operators' to fix. */
function refusedGrant(
  granted: Exclude<GrantAnswered, { kind: 'OK' }>,
  where: Readonly<{ signInId: ConnectionSignInId; connector: ConnectorId }>,
  log: FailureLog,
): Ended {
  const result = granted.kind === 'GRANT_REFUSED' ? 'REFUSED' : granted.kind
  const fields = { ...where, result, ...statusOf(granted.native) }
  if (result === 'APP_REFUSED') log.error(fields, 'CONNECTOR_APP_REFUSED')
  else log.info(fields, 'CONNECTION_SIGN_IN_REFUSED')
  return { result, connector: where.connector, native: granted.native }
}

/** The provider sent an `error` on the redirect instead of a code: read as a refused exchange, with what it sent as the native answer. */
function refusedRedirect(
  sent: { error: string; description?: string },
  connector: OAuthConnector,
  where: Readonly<{ signInId: ConnectionSignInId; connector: ConnectorId }>,
  log: FailureLog,
): Ended {
  const kind = connector.auth.refusals.app.includes(sent.error) ? 'APP_REFUSED' : 'GRANT_REFUSED'
  const native = { status: 302, code: sent.error, message: sent.description ?? null, body: null }
  return refusedGrant({ kind, native }, where, log)
}

/**
 * Completes an authorization (criteria 7, 8, 16, 18): taken first, then the code exchanged and the
 * account asked with no transaction open (D22), then written in one command, admitted again.
 */
export async function completeSignIn(
  deps: Deps,
  input: Viewer & {
    signInId: ConnectionSignInId
    answer: { code: string } | { refused: true } | { error: string; description?: string }
    log: FailureLog
  },
): Promise<SignInCompleted> {
  const { target, verifier } = await take(deps, input)
  const { connector } = target
  if ('refused' in input.answer) return { result: 'CANCELLED', connector: connector.id }
  const where = { signInId: input.signInId, connector: connector.id }
  if ('error' in input.answer) return refusedRedirect(input.answer, connector, where, input.log)
  const app = appKeysOf(deps.apps, connector)
  const { code } = input.answer
  const exchange = { code, redirectUri: redirectUriOf(deps), verifier: verifier.reveal() }
  const granted = await deps.executor.grant(
    where,
    connector,
    codeRequest(connector.auth, app, exchange),
    [app.clientSecret, code, exchange.verifier],
    GRANT_DEADLINE_MS,
  )
  if (granted.kind === 'UNREACHABLE')
    return { result: 'UNREACHABLE', connector: connector.id, native: granted.native }
  if (granted.kind !== 'OK') return refusedGrant(granted, where, input.log)
  const bearer = new Secret('BearerToken', granted.accessToken)
  const who = await deps.executor.who(where, connector, bearer, deps.callDeadlineMs)
  if (who.kind === 'UNREACHABLE')
    return { result: who.kind, connector: connector.id, native: who.native }
  if (who.kind === 'UNREADABLE')
    return { result: who.kind, connector: connector.id, native: who.native }
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
  const fields = { by: input.person.id, companyId: input.companyId, connectionId: linked.id }
  input.log.info({ ...fields, connector: connector.id }, event)
  return { result: 'LINKED', connection: linked }
}

const TAKEN = new Map<string, 'CONNECTION_ACCOUNT_ELSEWHERE' | 'CONNECTION_NAME_TAKEN'>([
  ['connection_account_key', 'CONNECTION_ACCOUNT_ELSEWHERE'],
  ['connection_name_key', 'CONNECTION_NAME_TAKEN'],
])

/**
 * The connection as the authorization leaves it: a new one NEW with its account, or Conectar de
 * novo replacing the seal and the account on the revision read at the start (C38), keeping the id
 * and the name. A unique key met names neither the row nor the other company (S10).
 */
async function written(
  deps: Deps,
  viewer: Viewer,
  target: Target,
  got: Readonly<{ tokens: ConnectionTokens; account: AccountOf }>,
): Promise<Connection> {
  const { connector } = target
  const id = target.connectionId ?? ConnectionId.parse(randomUUID())
  const sealed = sealTokens(deps, { id, companyId: viewer.companyId, connector }, got.tokens)
  const linked = {
    ...{ sealed: Buffer.from(sealed.blob), keyId: sealed.keyId, state: 'NEW' as const },
    ...{ accountRef: got.account.ref, accountLabel: got.account.label },
    ...{ linkedBy: viewer.person.id, linkedAt: sql`statement_timestamp()` },
  }
  return deps.database.command(scopeOf(viewer), async (tx) => {
    await admitted(deps, tx, viewer, 'manageConnections')
    try {
      if (target.connectionId === null)
        await tx.insert(connection).values({
          ...{ ...linked, id, companyId: viewer.companyId, connectorId: connector.id },
          ...{ name: target.name, connectorVersion: connector.version, attemptKey: randomUUID() },
        })
      else {
        const [updated] = await tx
          .update(connection)
          .set({
            ...{ ...linked, revision: target.revision + 1, refreshUntil: null },
            ...{ testedAt: null, testedBy: null, lastTest: null },
          })
          .where(and(ofCompany(viewer, id), eq(connection.revision, target.revision)))
          .returning({ id: connection.id })
        // Nothing written: the connection left, or changed meanwhile (another Conectar de novo).
        if (updated === undefined) {
          const [there] = await tx
            .select({ id: connection.id })
            .from(connection)
            .where(ofCompany(viewer, id))
          throw new Failure(
            there === undefined ? 'CONNECTION_NOT_FOUND' : 'CONNECTION_SIGN_IN_EXPIRED',
          )
        }
      }
    } catch (error) {
      const taken = TAKEN.get(violatedConstraint(error) ?? '')
      if (taken !== undefined) throw new Failure(taken, { cause: error })
      throw error
    }
    const [row] = await tx.select(columns).from(connection).where(ofCompany(viewer, id))
    if (row === undefined) throw new Failure('CONNECTION_NOT_FOUND')
    return viewOf(row)
  })
}
