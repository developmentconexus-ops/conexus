import type { PersonId } from '@conexus/hub-api'
import type { LanguageModel, MastraModelConfig } from '@mastra/core/llm'
import { PROVIDER_REGISTRY, parseModelString, resolveModelConfig } from '@mastra/core/llm'
import { and, asc, eq, isNull, lte, or, sql } from 'drizzle-orm'
import { z } from 'zod'
import type { IdentityPorts } from '../../hub/identity/public.ts'
import type { Database, Scope } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import type { Credential, SealKeys } from '../../platform/seal.ts'
import { open } from '../../platform/seal.ts'
import { contextOf, sealContext } from './accounts.ts'
import { subscriptionAccess } from './claude/store.ts'
import { SUBSCRIPTION_IDENTITY, subscriptionModel } from './claude/subscription-model.ts'
import type { CallFailure } from './errors.ts'
import type { GoogleAccount } from './google/calls.ts'
import { modelAccount } from './tables.ts'
import type { Picked, Turn } from './turn.ts'

/** The process of a Google account that takes its calls on this machine (step 12 U10). */
export type GoogleCalls = (
  account: GoogleAccount,
  scope: Scope,
) => Promise<{ url: string; apiKey: string }>

export type QueueDeps = {
  database: Database
  identity: IdentityPorts
  sealKeys: SealKeys
  googleCalls: GoogleCalls
}

/**
 * The model of one attempt, resolved as the runner resolves a processor's model
 * (`resolveModelConfig`), so the title and the observer get the same one.
 */
export async function callModel(config: MastraModelConfig): Promise<LanguageModel> {
  const model = await resolveModelConfig(config)
  if (model.specificationVersion === 'v1') throw new Error('MODEL_SPECIFICATION_UNSUPPORTED')
  return model
}

const Row = z.object({
  id: z.string(),
  personId: z.string().nullable(),
  kind: z.enum(['api_key', 'claude_subscription', 'google_cliproxy']),
  provider: z.string(),
  label: z.string(),
  position: z.number(),
  revision: z.number(),
})
type Row = z.infer<typeof Row>

export function providerOf(modelId: string): string {
  return parseModelString(modelId).provider ?? ''
}

/** The provider's name as the registry has it, such as "Anthropic", for the notices. */
export function providerName(provider: string): string {
  return Object.entries(PROVIDER_REGISTRY).find(([id]) => id === provider)?.[1].name ?? provider
}

function scopeOf(turn: Turn): Scope {
  return { kind: 'COMPANY', companyId: turn.companyId, personId: turn.personId }
}

/**
 * The person's order (step 11, P2): their own, then the company's given to them, then the
 * company's for everyone; another person's own never reaches here (the row policy).
 */
function partOf(row: Row, assignees: PersonId[] | undefined, personId: PersonId) {
  if (row.personId !== null) return 0
  if (assignees === undefined) return 2
  return assignees.includes(personId) ? 1 : undefined
}

async function credentialOf(
  tx: Parameters<Parameters<Database['read']>[1]>[0],
  deps: QueueDeps,
  turn: Turn,
  row: Row,
) {
  const result = await tx.execute(sql`select sealed, key_id from builder.sealed_of(${row.id})`)
  const found = z.object({ sealed: z.instanceof(Buffer), key_id: z.string() }).parse(result.rows[0])
  const context = sealContext({ ...row, companyId: turn.companyId })
  return open(deps.sealKeys, context, { keyId: found.key_id, blob: found.sealed })
}

/**
 * The next account of the provider for this turn, its credential opened in the transaction that
 * admits the person (security S32): paused, refused, a closed kind, one in its limit, and those
 * this turn tried are skipped. Nothing is called and no key is read from the environment.
 */
async function nextRow(deps: QueueDeps, turn: Turn, provider: string) {
  return deps.database.read(scopeOf(turn), async (tx) => {
    await deps.identity.admitMember({
      tx,
      personId: turn.personId,
      companyId: turn.companyId,
      action: 'useConversations',
    })
    const rows = await tx
      .select({
        id: modelAccount.id,
        personId: modelAccount.personId,
        kind: modelAccount.kind,
        provider: modelAccount.provider,
        label: modelAccount.label,
        position: modelAccount.position,
        revision: modelAccount.revision,
      })
      .from(modelAccount)
      .where(
        and(
          eq(modelAccount.companyId, turn.companyId),
          eq(modelAccount.provider, provider),
          eq(modelAccount.state, 'ready'),
          or(isNull(modelAccount.limitedUntil), lte(modelAccount.limitedUntil, sql`now()`)),
        ),
      )
      .orderBy(asc(modelAccount.position))
    const context = await contextOf(tx, turn.companyId)
    const ordered = rows
      .map((found) => Row.parse(found))
      .filter((row) => row.kind === 'api_key' || context.open.has(row.kind))
      .filter((row) => !turn.tried.has(row.id))
      .map((row) => ({ row, part: partOf(row, context.assignees.get(row.id), turn.personId) }))
      .filter((each): each is { row: Row; part: number } => each.part !== undefined)
      .sort((left, right) => left.part - right.part)
    const first = ordered[0]?.row
    if (first === undefined) return undefined
    return { row: first, credential: await credentialOf(tx, deps, turn, first) }
  })
}

async function pickedOf(
  deps: QueueDeps,
  turn: Turn,
  found: { row: Row; credential: Credential },
  modelId: string,
): Promise<Picked> {
  const { row, credential } = found
  const name = modelId.slice(row.provider.length + 1)
  const base = { id: row.id, label: row.label, kind: row.kind, modelId, systemLine: undefined }
  if (row.kind === 'claude_subscription') {
    const force = turn.refreshed.has(row.id)
    const account = { ...row, companyId: turn.companyId, credential }
    const access = await subscriptionAccess({ ...deps, scope: scopeOf(turn) }, account, force)
    const model = await callModel(subscriptionModel(name, access))
    return { ...base, model, systemLine: SUBSCRIPTION_IDENTITY }
  }
  const target = { providerId: row.provider, modelId: name }
  if (row.kind === 'google_cliproxy') {
    const { url, apiKey } = await deps.googleCalls(
      { ...row, companyId: turn.companyId, credential },
      scopeOf(turn),
    )
    return { ...base, model: await callModel({ ...target, url, apiKey }) }
  }
  return { ...base, model: await callModel({ ...target, apiKey: credential.reveal() }) }
}

/**
 * The account for the next attempt of `modelId` in this turn, or none left. A subscription whose
 * refresh is refused is marked refused and the next one is taken, as a refused call would be.
 */
export async function pickAccount(
  deps: QueueDeps,
  turn: Turn,
  modelId: string,
): Promise<Picked | undefined> {
  for (;;) {
    const found = await nextRow(deps, turn, providerOf(modelId))
    if (found === undefined) return undefined
    try {
      return await pickedOf(deps, turn, found, modelId)
    } catch (error) {
      if (!(error instanceof Failure)) throw error
      turn.tried.add(found.row.id)
      if (error.code === 'MODEL_ACCOUNT_REFUSED') {
        await markAccount(deps, turn, found.row.id, { kind: 'refused' })
      }
    }
  }
}

/**
 * The provider's refusal kept on the account (study D3, security S34): a limit until its time, a
 * refusal as `refused`, which the account screen shows "Ligue de novo". The same mark twice is the
 * same row.
 */
export async function markAccount(
  deps: QueueDeps,
  turn: Turn,
  accountId: string,
  failure: Extract<CallFailure, { kind: 'limited' | 'refused' }>,
): Promise<void> {
  const set =
    failure.kind === 'limited' ? { limitedUntil: failure.until } : { state: 'refused' as const }
  await deps.database.command(scopeOf(turn), (tx) =>
    tx
      .update(modelAccount)
      .set(set)
      .where(and(eq(modelAccount.id, accountId), eq(modelAccount.companyId, turn.companyId))),
  )
}
