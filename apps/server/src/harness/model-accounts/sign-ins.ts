import { randomUUID } from 'node:crypto'
import type {
  CompanyId,
  DeviceKind,
  Owner,
  PasteKind,
  PersonId,
  ProviderId,
  SignInKind,
} from '@conexus/hub-api'
import { isDeviceKind, SignInId } from '@conexus/hub-api'
import { and, eq, lte, sql } from 'drizzle-orm'
import type { CommandTx } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import type { Credential } from '../../platform/seal.ts'
import { open, seal } from '../../platform/seal.ts'
import type { Deps, Viewer } from './accounts.ts'
import { accountView, admitFor, insertAccount, labelOf, scopeOf } from './accounts.ts'
import { openKindsOf } from './kinds.ts'
import type { ReadingDeps } from './served.ts'
import { readServedOf } from './served.ts'
import { modelAccountSignIn } from './tables.ts'

/**
 * One way to sign in to a vendor's subscription by a code the person pastes back: `start` gives the
 * address to open and what must be kept, sealed, until the code comes back; `complete` trades the
 * code for the credential, or fails with MODEL_ACCOUNT_REFUSED or a 502. Claude's is the first;
 * Google's follows it.
 */
export type SignInFlow = {
  provider: ProviderId
  /** How long a started sign-in waits for its code. */
  seconds: number
  start(): Promise<{ url: string; pending: Credential }>
  complete(pending: Credential, code: string): Promise<Credential>
}

/** What one ask of the vendor answers: still waiting for the person, or the credential. */
export type DevicePoll =
  | { status: 'waiting'; retryMs: number }
  | { status: 'linked'; credential: Credential }

/**
 * One way to sign in by a code the Hub shows and the person types on the vendor's page: `start` gives
 * the page, the code and how often the vendor may be asked; `poll` asks once, with what `start`
 * kept sealed, or fails with MODEL_ACCOUNT_REFUSED or a 502.
 */
export type DeviceSignInFlow = {
  provider: ProviderId
  seconds: number
  start(): Promise<{ url: string; userCode: string; retryMs: number; pending: Credential }>
  poll(pending: Credential): Promise<DevicePoll>
}

/** The flows by the way the code comes back (`SIGN_IN_ENTRY`), then by kind. */
export type SignInFlows = {
  readonly paste: Readonly<Record<PasteKind, SignInFlow>>
  readonly device: Readonly<Record<DeviceKind, DeviceSignInFlow>>
}

/** What the sign-in routes hold: the flows, and the means to read a Google account's list once linked. */
export type SignInDeps = { flows: SignInFlows; googleCalls: ReadingDeps['googleCalls'] }

export type SignIn = { id: SignInId; companyId: CompanyId; personId: PersonId; kind: SignInKind }

export function sealContext(signIn: SignIn, provider: ProviderId) {
  return {
    purpose: 'model-account-sign-in',
    rowId: signIn.id,
    companyId: signIn.companyId,
    personId: signIn.personId,
    kind: signIn.kind,
    provider,
  } as const
}

export async function admitOpen(
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

type Waiting = { provider: ProviderId; seconds: number }

/** Seals what the flow keeps and inserts the sign-in, due to be asked at once (`poll_at` defaults to now). */
async function insertSignIn(
  deps: Deps,
  input: Viewer & { owner: Owner; kind: SignInKind },
  label: string,
  flow: Waiting,
  pending: Credential,
) {
  const signIn = {
    id: SignInId.parse(randomUUID()),
    companyId: input.companyId,
    personId: input.person.id,
    kind: input.kind,
  }
  const sealed = seal(deps.sealKeys, sealContext(signIn, flow.provider), pending)
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
  return { signInId: signIn.id, expiresAt: row.expiresAt.toISOString() }
}

/**
 * Starts a sign-in (criteria 19, 20): the admission and the open kind first, then the vendor's
 * address, and what it must keep sealed to the row for the flow's `seconds`. The answer says which
 * way the code comes back: pasted (`paste`) or typed on the vendor's page (`device`).
 */
export async function startSignIn(
  deps: Deps & { flows: SignInFlows },
  input: Viewer & { owner: Owner; kind: SignInKind; label: string },
) {
  await deps.database.command(scopeOf(input), (tx) =>
    admitOpen(deps, tx, input, input.owner, input.kind),
  )
  const label = labelOf(input.label)
  if (isDeviceKind(input.kind)) {
    const flow = deps.flows.device[input.kind]
    const { url, userCode, retryMs, pending } = await flow.start()
    const made = await insertSignIn(deps, input, label, flow, pending)
    return { entry: 'device' as const, ...made, url, userCode, retryMs }
  }
  const flow = deps.flows.paste[input.kind]
  const { url, pending } = await flow.start()
  const made = await insertSignIn(deps, input, label, flow, pending)
  return { entry: 'paste' as const, ...made, url }
}

/** The person is a member of the company, who may read its model accounts. */
export function admitReader(deps: Deps, tx: Parameters<typeof admitFor>[1], viewer: Viewer) {
  return deps.identity.admitMember({
    tx,
    personId: viewer.person.id,
    companyId: viewer.companyId,
    action: 'readModelAccounts',
  })
}

/**
 * Seals the credential a finished sign-in gave to a new account at the end of its queue, in the
 * transaction that holds the sign-in, and shows it as the person sees it.
 */
export async function linkAccount(
  deps: Deps,
  tx: CommandTx,
  input: Viewer & { signInId: SignInId },
  taken: { owner: Owner; kind: SignInKind; label: string },
  made: { provider: ProviderId; credential: Credential },
) {
  await admitOpen(deps, tx, input, taken.owner, taken.kind)
  const id = await insertAccount(deps, tx, input, {
    ...taken,
    ...made,
    hint: null,
    attemptKey: input.signInId,
  })
  return accountView(tx, input, id)
}

/**
 * Takes the sign-in once (security S22): `DELETE … RETURNING`, so a second try, or one after ten
 * minutes, finds nothing. A closed kind, or one whose code is typed on the vendor's page, rolls back
 * and keeps it; a late one leaves, and it is 410.
 */
function take(deps: Deps, input: Viewer & { signInId: SignInId }) {
  return deps.database.command(scopeOf(input), async (tx) => {
    await admitReader(deps, tx, input)
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
    if (isDeviceKind(taken.kind)) throw new Failure('MODEL_ACCOUNT_SIGN_IN_WRONG_ENTRY')
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
  deps: Deps & SignInDeps,
  input: Viewer & { signInId: SignInId; code: string },
) {
  const taken = await take(deps, input)
  if (taken === undefined) throw new Failure('MODEL_ACCOUNT_SIGN_IN_EXPIRED')
  const { kind } = taken
  const flow = deps.flows.paste[kind]
  const signIn = { id: input.signInId, companyId: input.companyId, personId: input.person.id, kind }
  const pending = open(deps.sealKeys, sealContext(signIn, flow.provider), {
    keyId: taken.keyId,
    blob: taken.sealed,
  })
  const credential = await flow.complete(pending, input.code)
  const made = await deps.database.command(scopeOf(input), async (tx) => ({
    account: await linkAccount(deps, tx, input, taken, { provider: flow.provider, credential }),
  }))
  if (kind === 'google_cliproxy') {
    await readServedOf(deps, scopeOf(input), input.companyId, made.account.id)
  }
  return made
}
