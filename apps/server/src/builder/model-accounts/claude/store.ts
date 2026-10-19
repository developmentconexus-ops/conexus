import { setTimeout } from 'node:timers/promises'
import { and, eq, isNull, lt, or, sql } from 'drizzle-orm'
import type { Database, Scope } from '../../../platform/database.ts'
import type { FailureLog } from '../../../platform/failure.ts'
import { Failure } from '../../../platform/failure.ts'
import type { SealKeys } from '../../../platform/seal.ts'
import { Credential, open, seal } from '../../../platform/seal.ts'
import { sealContext } from '../accounts.ts'
import { modelAccount } from '../tables.ts'
import type { SubscriptionTokens } from './anthropic-login.ts'
import {
  AnthropicRefusal,
  refreshAnthropicTokens,
  SubscriptionTokens as Tokens,
} from './anthropic-login.ts'

// How long one refresh holds its account (data D25); a second caller waits for it, then reads.
const LEASE_MS = 30_000
const WAIT_STEP_MS = 200

export type SubscriptionAccount = {
  id: string
  companyId: string
  personId: string | null
  provider: string
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
    const sealed = await tx.execute(
      sql`select sealed, key_id from builder.sealed_of(${account.id})`,
    )
    const found = sealed.rows[0]
    if (
      row === undefined ||
      !(found?.sealed instanceof Buffer) ||
      typeof found.key_id !== 'string'
    ) {
      throw new Failure('NOT_FOUND')
    }
    const context = sealContext({ ...account, kind: 'claude_subscription' })
    const credential = open(deps.sealKeys, context, { keyId: found.key_id, blob: found.sealed })
    return { ...row, credential }
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
  const sealed = seal(
    deps.sealKeys,
    sealContext({ ...account, kind: 'claude_subscription' }),
    Credential.parse(JSON.stringify(tokens)),
  )
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
 * A refresh that failed gives the account back, `refused` when Anthropic refused its token (S34),
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
 * otherwise one refresh, reserved in the database, so two turns call Anthropic once, with no
 * transaction open during the call (data D22). The other caller waits for the reserved one to land,
 * or to fail. `force` refreshes a token Anthropic refused before the account is called refused.
 */
export async function subscriptionAccess(
  deps: Deps,
  account: SubscriptionAccount,
  force = false,
): Promise<string> {
  const tokens = Tokens.parse(JSON.parse(account.credential.reveal()))
  if (!force && tokens.expires > Date.now()) return tokens.access
  if (await reserve(deps, account)) {
    let renewed: SubscriptionTokens
    try {
      renewed = await refreshAnthropicTokens(tokens.refresh)
    } catch (error) {
      const refused = error instanceof AnthropicRefusal && (error.status ?? 500) < 500
      await release(deps, account, refused)
      throw new Failure(refused ? 'MODEL_ACCOUNT_REFUSED' : 'MODEL_ACCOUNT_UNAVAILABLE', {
        details: { provider: account.provider },
        cause: error,
      })
    }
    await store(deps, account, renewed)
    deps.log.info({ companyId: account.companyId, accountId: account.id }, 'MODEL_TOKEN_REFRESHED')
    return renewed.access
  }
  const deadline = Date.now() + LEASE_MS
  for (;;) {
    const now = await reread(deps, account)
    if (now.revision !== account.revision) {
      return Tokens.parse(JSON.parse(now.credential.reveal())).access
    }
    const details = { provider: account.provider }
    if (now.state === 'refused') throw new Failure('MODEL_ACCOUNT_REFUSED', { details })
    const leased = now.refreshUntil !== null && now.refreshUntil.getTime() > Date.now()
    if (!leased || Date.now() >= deadline)
      throw new Failure('MODEL_ACCOUNT_UNAVAILABLE', { details })
    await setTimeout(WAIT_STEP_MS)
  }
}
