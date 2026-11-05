import { setTimeout } from 'node:timers/promises'
import type {
  CompanyId,
  ModelAccountId,
  PersonId,
  ProviderId,
  SubscriptionKind,
} from '@conexus/hub-api'
import { and, eq, isNull, lt, or, sql } from 'drizzle-orm'
import { z } from 'zod'
import type { Database, Scope } from '../../platform/database.ts'
import type { FailureLog } from '../../platform/failure.ts'
import { Failure } from '../../platform/failure.ts'
import type { SealKeys } from '../../platform/seal.ts'
import { Credential, seal } from '../../platform/seal.ts'
import { credentialOf, sealContext } from './accounts.ts'
import { modelAccount } from './tables.ts'

// How long one refresh holds its account (data D25); a second caller waits for it, then reads.
const LEASE_MS = 30_000
const WAIT_STEP_MS = 200

/** The subscription's tokens, sealed whole in its account: `expires` is milliseconds since 1970. */
export const SubscriptionTokens = z.object({
  refresh: z.string().min(1),
  access: z.string().min(1),
  expires: z.number(),
  accountId: z.string().min(1).optional(),
})
export type SubscriptionTokens = z.infer<typeof SubscriptionTokens>

/** A vendor refused the token or the code: `status` is its HTTP status, or none before any call. */
export class SubscriptionRefusal extends Error {
  readonly status: number | undefined

  constructor(reason: string, status?: number) {
    super(reason)
    this.name = 'SubscriptionRefusal'
    this.status = status
  }
}

/** One kind's renewal: the sealed tokens in, the vendor's new ones out. */
export type Renewal = (tokens: SubscriptionTokens) => Promise<SubscriptionTokens>

export type SubscriptionAccount = {
  id: ModelAccountId
  companyId: CompanyId
  personId: PersonId | null
  kind: SubscriptionKind
  provider: ProviderId
  revision: number
  credential: Credential
}

type Deps = { database: Database; sealKeys: SealKeys; scope: Scope; log: FailureLog }

/** The account's tokens as sealed, with its revision, read again after another refresh. */
async function reread(deps: Deps, account: SubscriptionAccount) {
  return deps.database.read(deps.scope, async (tx) => {
    const [row] = await tx
      .select({
        revision: modelAccount.revision,
        state: modelAccount.state,
        refreshUntil: modelAccount.refreshUntil,
      })
      .from(modelAccount)
      .where(eq(modelAccount.id, account.id))
    if (row === undefined) throw new Failure('NOT_FOUND')
    return { ...row, credential: await credentialOf(deps, tx, account) }
  })
}

async function reserve(deps: Deps, account: SubscriptionAccount): Promise<boolean> {
  const reserved = await deps.database.command(deps.scope, (tx) =>
    tx
      .update(modelAccount)
      .set({ refreshUntil: sql`statement_timestamp() + ${`${LEASE_MS} milliseconds`}::interval` })
      .where(
        and(
          eq(modelAccount.id, account.id),
          eq(modelAccount.revision, account.revision),
          eq(modelAccount.state, 'ready'),
          or(isNull(modelAccount.refreshUntil), lt(modelAccount.refreshUntil, sql`now()`)),
        ),
      )
      .returning({ id: modelAccount.id }),
  )
  return reserved.length === 1
}

async function store(deps: Deps, account: SubscriptionAccount, tokens: SubscriptionTokens) {
  const sealed = seal(deps.sealKeys, sealContext(account), Credential.parse(JSON.stringify(tokens)))
  await deps.database.command(deps.scope, (tx) =>
    tx
      .update(modelAccount)
      .set({
        sealed: Buffer.from(sealed.blob),
        keyId: sealed.keyId,
        revision: account.revision + 1,
        refreshUntil: null,
      })
      .where(and(eq(modelAccount.id, account.id), eq(modelAccount.revision, account.revision))),
  )
}

/**
 * A refresh that failed gives the account back, `refused` when the vendor refused its token (S34),
 * so the caller waiting for it stops now rather than at the lease's end.
 */
async function release(deps: Deps, account: SubscriptionAccount, refused: boolean) {
  const set = refused ? { refreshUntil: null, state: 'refused' as const } : { refreshUntil: null }
  await deps.database.command(deps.scope, (tx) =>
    tx
      .update(modelAccount)
      .set(set)
      .where(and(eq(modelAccount.id, account.id), eq(modelAccount.revision, account.revision))),
  )
}

/**
 * The subscription's access token for one call (security S34): the sealed one while it lives;
 * otherwise one refresh, reserved in the database, so two turns call the vendor once, with no
 * transaction open during the call (data D22). The other caller waits for the reserved one to land,
 * or to fail. `force` refreshes a token the vendor refused before the account is called refused.
 */
export async function subscriptionAccess(
  deps: Deps,
  account: SubscriptionAccount,
  renew: Renewal,
  force = false,
): Promise<SubscriptionTokens> {
  const tokens = SubscriptionTokens.parse(JSON.parse(account.credential.reveal()))
  if (!force && tokens.expires > Date.now()) return tokens
  if (await reserve(deps, account)) {
    let renewed: SubscriptionTokens
    try {
      renewed = await renew(tokens)
    } catch (error) {
      const refused = error instanceof SubscriptionRefusal && (error.status ?? 500) < 500
      await release(deps, account, refused)
      throw new Failure(refused ? 'MODEL_ACCOUNT_REFUSED' : 'MODEL_ACCOUNT_UNAVAILABLE', {
        details: { provider: account.provider },
        cause: error,
      })
    }
    await store(deps, account, renewed)
    deps.log.info({ companyId: account.companyId, accountId: account.id }, 'MODEL_TOKEN_REFRESHED')
    return renewed
  }
  const deadline = Date.now() + LEASE_MS
  for (;;) {
    const now = await reread(deps, account)
    if (now.revision !== account.revision) {
      return SubscriptionTokens.parse(JSON.parse(now.credential.reveal()))
    }
    const details = { provider: account.provider }
    if (now.state === 'refused') throw new Failure('MODEL_ACCOUNT_REFUSED', { details })
    const leased = now.refreshUntil !== null && now.refreshUntil.getTime() > Date.now()
    if (!leased || Date.now() >= deadline)
      throw new Failure('MODEL_ACCOUNT_UNAVAILABLE', { details })
    await setTimeout(WAIT_STEP_MS)
  }
}
