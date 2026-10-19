import { randomUUID } from 'node:crypto'
import type { CompanyId, Owner, PersonId, ProviderId, SignInKind } from '@conexus/hub-api'
import { SignInId } from '@conexus/hub-api'
import { and, eq, lte, sql } from 'drizzle-orm'
import { Failure } from '../../platform/failure.ts'
import type { Credential } from '../../platform/seal.ts'
import { open, seal } from '../../platform/seal.ts'
import type { Deps, Viewer } from './accounts.ts'
import { accountView, admitFor, insertAccount, labelOf, scopeOf } from './accounts.ts'
import { openKindsOf } from './kinds.ts'
import { modelAccountSignIn } from './tables.ts'

/**
 * One way to sign in to a vendor's subscription: `start` gives the address to open and what must be
 * kept, sealed, until the code comes back; `complete` trades the code for the credential, or fails
 * with MODEL_ACCOUNT_REFUSED or a 502. Claude's is the first; Google's follows it.
 */
export type SignInFlow = {
  provider: ProviderId
  /** How long a started sign-in waits for its code. */
  seconds: number
  start(): Promise<{ url: string; pending: Credential }>
  complete(pending: Credential, code: string): Promise<Credential>
}
export type SignInFlows = Readonly<Record<SignInKind, SignInFlow>>

type SignIn = { id: SignInId; companyId: CompanyId; personId: PersonId; kind: SignInKind }

function sealContext(signIn: SignIn, flow: SignInFlow) {
  return {
    purpose: 'model-account-sign-in',
    rowId: signIn.id,
    companyId: signIn.companyId,
    personId: signIn.personId,
    kind: signIn.kind,
    provider: flow.provider,
  } as const
}

async function admitOpen(
  deps: Deps,
  tx: Parameters<typeof admitFor>[1],
  viewer: Viewer,
  owner: Owner,
  kind: SignInKind,
) {
  await admitFor(deps, tx, viewer, owner)
  if (!(await openKindsOf(tx, viewer.companyId)).has(kind))
    throw new Failure('MODEL_ACCOUNT_KIND_OFF', { details: { kind } })
}

/**
 * Starts a sign-in (criteria 19, 20): the admission and the open kind first, then the vendor's
 * address, and what it must keep sealed to the row for the flow's `seconds`.
 */
export async function startSignIn(
  deps: Deps & { flows: SignInFlows },
  input: Viewer & { owner: Owner; kind: SignInKind; label: string },
) {
  await deps.database.command(scopeOf(input), (tx) =>
    admitOpen(deps, tx, input, input.owner, input.kind),
  )
  const label = labelOf(input.label)
  const flow = deps.flows[input.kind]
  const { url, pending } = await flow.start()
  const signIn = {
    id: SignInId.parse(randomUUID()),
    companyId: input.companyId,
    personId: input.person.id,
    kind: input.kind,
  }
  const sealed = seal(deps.sealKeys, sealContext(signIn, flow), pending)
  const [row] = await deps.database.command(scopeOf(input), async (tx) => {
    // The person's sign-ins that ran out leave as a new one comes (security S22).
    await tx
      .delete(modelAccountSignIn)
      .where(
        and(
          eq(modelAccountSignIn.companyId, input.companyId),
          eq(modelAccountSignIn.personId, input.person.id),
          lte(modelAccountSignIn.expiresAt, sql`statement_timestamp()`),
        ),
      )
    return tx
      .insert(modelAccountSignIn)
      .values({
        ...signIn,
        owner: input.owner,
        label,
        sealed: Buffer.from(sealed.blob),
        keyId: sealed.keyId,
        expiresAt: sql`statement_timestamp() + make_interval(secs => ${flow.seconds})`,
      })
      .returning({ expiresAt: modelAccountSignIn.expiresAt })
  })
  if (row === undefined) throw new Failure('INTERNAL_UNEXPECTED')
  return { signInId: signIn.id, url, expiresAt: row.expiresAt.toISOString() }
}

/**
 * Takes the sign-in once (security S22): `DELETE … RETURNING`, so a second try, or one after ten
 * minutes, finds nothing. A closed kind rolls back and keeps it; a late one leaves, and both 410.
 */
function take(deps: Deps, input: Viewer & { signInId: SignInId }) {
  return deps.database.command(scopeOf(input), async (tx) => {
    await deps.identity.admitMember({
      tx,
      personId: input.person.id,
      companyId: input.companyId,
      action: 'readModelAccounts',
    })
    const [taken] = await tx
      .delete(modelAccountSignIn)
      .where(
        and(
          eq(modelAccountSignIn.id, input.signInId),
          eq(modelAccountSignIn.companyId, input.companyId),
          eq(modelAccountSignIn.personId, input.person.id),
        ),
      )
      .returning({
        kind: modelAccountSignIn.kind,
        owner: modelAccountSignIn.owner,
        label: modelAccountSignIn.label,
        sealed: modelAccountSignIn.sealed,
        keyId: modelAccountSignIn.keyId,
        live: sql<boolean>`${modelAccountSignIn.expiresAt} > statement_timestamp()`,
      })
    if (taken === undefined || !taken.live || taken.kind === 'api_key') return undefined
    await admitOpen(deps, tx, input, taken.owner, taken.kind)
    return { ...taken, kind: taken.kind }
  })
}

/**
 * Completes a sign-in (criteria 19, 20, 22). The vendor's trade runs with no transaction open
 * (data D22): taking the sign-in commits first, so any attempt ends it, and a refused trade keeps
 * nothing new. The credential is then sealed whole to a new account at the end of its queue.
 */
export async function completeSignIn(
  deps: Deps & { flows: SignInFlows },
  input: Viewer & { signInId: SignInId; code: string },
) {
  const taken = await take(deps, input)
  if (taken === undefined) throw new Failure('MODEL_ACCOUNT_SIGN_IN_EXPIRED')
  const { kind, owner, label } = taken
  const flow = deps.flows[kind]
  const signIn = { id: input.signInId, companyId: input.companyId, personId: input.person.id, kind }
  const pending = open(deps.sealKeys, sealContext(signIn, flow), {
    keyId: taken.keyId,
    blob: taken.sealed,
  })
  const credential = await flow.complete(pending, input.code)
  return deps.database.command(scopeOf(input), async (tx) => {
    await admitOpen(deps, tx, input, owner, kind)
    const id = await insertAccount(deps, tx, input, {
      owner,
      kind,
      provider: flow.provider,
      label,
      credential,
      hint: null,
      attemptKey: input.signInId,
    })
    return { account: await accountView(tx, input, id) }
  })
}
