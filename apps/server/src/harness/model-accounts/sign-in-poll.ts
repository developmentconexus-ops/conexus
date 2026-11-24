import type { DeviceKind, ModelAccount, Owner, SignInId } from '@conexus/hub-api'
import {
  DEVICE_KINDS,
  isDeviceKind,
  ModelAccountId,
  SignInKind as SignInKindSchema,
} from '@conexus/hub-api'
import { and, eq, gt, inArray, lte, sql } from 'drizzle-orm'
import type { CommandTx } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import { open } from '../../platform/seal.ts'
import type { Deps, Viewer } from './accounts.ts'
import { accountView, scopeOf } from './accounts.ts'
import type { DevicePoll, SignInDeps } from './sign-ins.ts'
import { admitOpen, admitReader, linkAccount, sealContext } from './sign-ins.ts'
import { modelAccount, modelAccountSignIn } from './tables.ts'

type Poll = { status: 'waiting'; retryMs: number } | { status: 'linked'; account: ModelAccount }
type Held = { kind: DeviceKind; owner: Owner; label: string; sealed: Buffer; keyId: string }

/** The pause a sign-in another ask holds waits before it is asked again. */
const HELD_RETRY_MS = 250

function ofSignIn(input: Viewer & { signInId: SignInId }) {
  return and(
    eq(modelAccountSignIn.id, input.signInId),
    eq(modelAccountSignIn.companyId, input.companyId),
    eq(modelAccountSignIn.personId, input.person.id),
  )
}

/** Reserves the sign-in for this ask: `poll_at` moves to the end of its window, so a second ask finds it held. */
async function hold(deps: Deps, tx: CommandTx, input: Viewer & { signInId: SignInId }) {
  const [held] = await tx
    .update(modelAccountSignIn)
    .set({ pollAt: modelAccountSignIn.expiresAt })
    .where(
      and(
        ofSignIn(input),
        inArray(modelAccountSignIn.kind, DEVICE_KINDS),
        gt(modelAccountSignIn.expiresAt, sql`statement_timestamp()`),
        lte(modelAccountSignIn.pollAt, sql`statement_timestamp()`),
      ),
    )
    .returning({
      kind: modelAccountSignIn.kind,
      owner: modelAccountSignIn.owner,
      label: modelAccountSignIn.label,
      sealed: modelAccountSignIn.sealed,
      keyId: modelAccountSignIn.keyId,
    })
  if (held === undefined) return undefined
  const kind = SignInKindSchema.parse(held.kind)
  if (!isDeviceKind(kind)) throw new Failure('INTERNAL_UNEXPECTED')
  await admitOpen(deps, tx, input, held.owner, kind)
  return { ...held, kind }
}

/** A live sign-in another ask holds, or one not yet due, answers `waiting` with what is left. */
async function waitingOn(deps: Deps, tx: CommandTx, input: Viewer & { signInId: SignInId }) {
  const [entry] = await tx
    .select({
      kind: modelAccountSignIn.kind,
      owner: modelAccountSignIn.owner,
      pollAt: modelAccountSignIn.pollAt,
      expiresAt: modelAccountSignIn.expiresAt,
      live: sql<boolean>`${modelAccountSignIn.expiresAt} > statement_timestamp()`,
      waitMs: sql<number>`ceil(extract(epoch from ${modelAccountSignIn.pollAt} - statement_timestamp()) * 1000)::int`,
    })
    .from(modelAccountSignIn)
    .where(ofSignIn(input))
  if (entry === undefined) return undefined
  const kind = SignInKindSchema.parse(entry.kind)
  if (!isDeviceKind(kind)) throw new Failure('MODEL_ACCOUNT_SIGN_IN_WRONG_ENTRY')
  if (!entry.live) throw new Failure('MODEL_ACCOUNT_SIGN_IN_EXPIRED')
  await admitOpen(deps, tx, input, entry.owner, kind)
  const held = entry.pollAt.getTime() >= entry.expiresAt.getTime()
  return { status: 'waiting', retryMs: held ? HELD_RETRY_MS : Math.max(entry.waitMs, 1) } as const
}

/** The account a sign-in that is gone made for this person, if it made one (criterion 7). */
async function linkedBy(tx: CommandTx, input: Viewer & { signInId: SignInId }) {
  const [made] = await tx
    .select({ id: modelAccount.id })
    .from(modelAccount)
    .where(
      and(
        eq(modelAccount.companyId, input.companyId),
        eq(modelAccount.attemptKey, input.signInId),
        eq(modelAccount.linkedBy, input.person.id),
        inArray(modelAccount.kind, DEVICE_KINDS),
      ),
    )
  if (made === undefined) throw new Failure('MODEL_ACCOUNT_SIGN_IN_EXPIRED')
  return {
    status: 'linked',
    account: await accountView(tx, input, ModelAccountId.parse(made.id)),
  } as const
}

/**
 * The first step of a poll, in one transaction: reserve the sign-in for this ask, or say why not. A
 * closed kind rolls the reservation back and the sign-in stays (criterion 21).
 */
function reserve(
  deps: Deps,
  input: Viewer & { signInId: SignInId },
): Promise<{ held: Held } | { answer: Poll }> {
  return deps.database.command(scopeOf(input), async (tx) => {
    await admitReader(deps, tx, input)
    const held = await hold(deps, tx, input)
    if (held !== undefined) return { held }
    return { answer: (await waitingOn(deps, tx, input)) ?? (await linkedBy(tx, input)) }
  })
}

/** Gives the sign-in back after a failed ask: refused ends it, a vendor that did not answer lets it be asked again. */
async function settle(deps: Deps, input: Viewer & { signInId: SignInId }, error: unknown) {
  if (!(error instanceof Failure)) return
  await deps.database.command(scopeOf(input), async (tx) => {
    if (error.code === 'MODEL_ACCOUNT_REFUSED') {
      await tx.delete(modelAccountSignIn).where(ofSignIn(input))
    } else if (error.code === 'MODEL_ACCOUNT_UNAVAILABLE') {
      await tx
        .update(modelAccountSignIn)
        .set({ pollAt: sql`statement_timestamp()` })
        .where(ofSignIn(input))
    }
  })
}

/**
 * One ask of a device-code sign-in (criteria 5 to 8, 20, 21): the reservation commits first, so two
 * asks make one call to the vendor, and the call runs with no transaction open (data D22). `waiting`
 * schedules the next ask; the code typed ends the sign-in and seals the credential whole to a new
 * account at the end of its queue, in one transaction.
 */
export async function pollSignIn(
  deps: Deps & SignInDeps,
  input: Viewer & { signInId: SignInId },
): Promise<Poll> {
  const reserved = await reserve(deps, input)
  if ('answer' in reserved) return reserved.answer
  const { kind } = reserved.held
  const flow = deps.flows.device[kind]
  const signIn = { id: input.signInId, companyId: input.companyId, personId: input.person.id, kind }
  const pending = open(deps.sealKeys, sealContext(signIn, flow.provider), {
    keyId: reserved.held.keyId,
    blob: reserved.held.sealed,
  })
  let polled: DevicePoll
  try {
    polled = await flow.poll(pending)
  } catch (error) {
    await settle(deps, input, error)
    throw error
  }
  if (polled.status === 'waiting') {
    await deps.database.command(scopeOf(input), (tx) =>
      tx
        .update(modelAccountSignIn)
        .set({ pollAt: sql`statement_timestamp() + ${`${polled.retryMs} milliseconds`}::interval` })
        .where(ofSignIn(input)),
    )
    return { status: 'waiting', retryMs: polled.retryMs }
  }
  const { credential } = polled
  try {
    return await deps.database.command(scopeOf(input), async (tx) => {
      await tx.delete(modelAccountSignIn).where(ofSignIn(input))
      const account = await linkAccount(deps, tx, input, reserved.held, {
        provider: flow.provider,
        credential,
      })
      return { status: 'linked', account }
    })
  } catch (error) {
    // The grant is spent, so the sign-in cannot be asked again: end it, and the next ask says it expired.
    await deps.database.command(scopeOf(input), (tx) =>
      tx.delete(modelAccountSignIn).where(ofSignIn(input)),
    )
    throw error
  }
}
