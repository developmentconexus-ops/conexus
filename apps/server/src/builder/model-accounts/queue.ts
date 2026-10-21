import type { ModelAccountId, ModelId } from '@conexus/hub-api'
import type { LanguageModel, MastraModelConfig } from '@mastra/core/llm'
import { PROVIDER_REGISTRY, parseModelString, resolveModelConfig } from '@mastra/core/llm'
import { and, asc, eq } from 'drizzle-orm'
import type { IdentityPorts } from '../../hub/identity/public.ts'
import type { Database, ReadTx, Scope } from '../../platform/database.ts'
import type { FailureLog } from '../../platform/failure.ts'
import { Failure, logFailure } from '../../platform/failure.ts'
import type { Credential, SealKeys } from '../../platform/seal.ts'
import { AccountRow, columns, contextOf, credentialOf, usableInOrder } from './accounts.ts'
import { subscriptionAccess } from './claude/store.ts'
import { subscriptionModel } from './claude/subscription-model.ts'
import type { AccountFailure } from './errors.ts'
import type { GoogleAccount } from './google/calls.ts'
import { isChoosable } from './providers.ts'
import { servesModel } from './served.ts'
import { readServedOf } from './served-reads.ts'
import { modelAccount } from './tables.ts'
import type { Picked, Turn } from './turn.ts'

/**
 * The process of a Google account that takes its calls on this machine (step 12 U10); `hold`
 * keeps it while a call runs and gives back its release.
 */
export type GoogleCalls = (
  account: GoogleAccount,
  scope: Scope,
) => Promise<{ url: string; apiKey: string; hold: () => () => void }>

export type QueueDeps = {
  database: Database
  identity: IdentityPorts
  sealKeys: SealKeys
  googleCalls: GoogleCalls
  log: FailureLog
}

/**
 * The model of one attempt, resolved as the runner resolves a processor's model
 * (`resolveModelConfig`), so the title and the observer get the same one.
 */
export async function callModel(config: MastraModelConfig): Promise<LanguageModel> {
  const model = await resolveModelConfig(config)
  if (model.specificationVersion === 'v1') {
    throw new Failure('INTERNAL_UNEXPECTED', { details: { reason: 'MODEL_SPECIFICATION_V1' } })
  }
  return model
}

/** The provider of a router model, as Mastra reads it; a model that names none is not one. */
export function providerOf(modelId: ModelId): string {
  const { provider } = parseModelString(modelId)
  if (provider === null) throw new Failure('MODEL_UNKNOWN')
  return provider
}

/** The provider's name as the registry has it, such as "Anthropic", for the notices. */
export function providerName(provider: string): string {
  return Object.entries(PROVIDER_REGISTRY).find(([id]) => id === provider)?.[1].name ?? provider
}

function scopeOf(turn: Turn): Scope {
  return { kind: 'COMPANY', companyId: turn.companyId, personId: turn.personId }
}

export type Asker = {
  companyId: Turn['companyId']
  personId: Turn['personId']
  tried: ReadonlySet<ModelAccountId>
}

/**
 * The provider's accounts that serve the model and that the person may use now, in their order
 * (`usableInOrder`), less those this turn tried. The caller admitted the person.
 */
async function queuedRows(tx: ReadTx, asker: Asker, model: ModelId): Promise<AccountRow[]> {
  const rows = await tx
    .select(columns)
    .from(modelAccount)
    .where(
      and(
        eq(modelAccount.companyId, asker.companyId),
        eq(modelAccount.provider, providerOf(model)),
      ),
    )
    .orderBy(asc(modelAccount.position))
  const context = await contextOf(tx, asker.companyId)
  return usableInOrder(
    rows.map((row) => AccountRow.parse(row)),
    context,
    asker.personId,
  ).filter((row) => servesModel(row, model) && !asker.tried.has(row.id))
}

export function admitted(deps: QueueDeps, tx: ReadTx, asker: Asker) {
  return deps.identity.admitMember({
    tx,
    personId: asker.personId,
    companyId: asker.companyId,
    action: 'useConversations',
  })
}

/**
 * The next account of the provider for this turn, its credential opened in the transaction that
 * admits the person (security S32). Nothing is called and no key is read from the environment.
 */
async function nextRow(deps: QueueDeps, turn: Turn, model: ModelId) {
  return deps.database.read(scopeOf(turn), async (tx) => {
    await admitted(deps, tx, turn)
    const [first] = await queuedRows(tx, turn, model)
    if (first === undefined) return undefined
    const credential = await credentialOf(deps, tx, { ...first, companyId: turn.companyId })
    return { row: first, credential }
  })
}

/** Whether the person may call an account of the model's provider now. */
export async function hasAccount(tx: ReadTx, who: Asker, model: ModelId): Promise<boolean> {
  return (await queuedRows(tx, who, model)).length > 0
}

/**
 * The model a conversation changes to: one the picker does not offer is `MODEL_UNKNOWN`, and one
 * with no account the person may use now is `MODEL_NO_ACCOUNT`. No credential is opened.
 */
export async function conversationModel(
  deps: QueueDeps,
  asker: { companyId: Turn['companyId']; personId: Turn['personId'] },
  asked: ModelId,
): Promise<ModelId> {
  const scope: Scope = { kind: 'COMPANY', ...asker }
  return deps.database.read(scope, async (tx) => {
    const who = { ...asker, tried: new Set<ModelAccountId>() }
    await admitted(deps, tx, who)
    if (!isChoosable(asked)) throw new Failure('MODEL_UNKNOWN')
    if (!(await hasAccount(tx, who, asked))) throw new Failure('MODEL_NO_ACCOUNT')
    return asked
  })
}

async function pickedOf(
  deps: QueueDeps,
  turn: Turn,
  found: { row: AccountRow; credential: Credential },
  modelId: ModelId,
): Promise<Picked> {
  const { row, credential } = found
  const { modelId: name } = parseModelString(modelId)
  const base = { id: row.id, label: row.label, kind: row.kind, modelId }
  if (row.kind === 'claude_subscription') {
    const force = turn.refreshed.has(row.id)
    const account = { ...row, companyId: turn.companyId, credential }
    const access = await subscriptionAccess({ ...deps, scope: scopeOf(turn) }, account, force)
    const model = await callModel(subscriptionModel(name, access))
    return { ...base, model }
  }
  const target = { providerId: row.provider, modelId: name }
  if (row.kind === 'google_cliproxy') {
    const { url, apiKey, hold } = await deps.googleCalls(
      { ...row, companyId: turn.companyId, credential },
      scopeOf(turn),
    )
    turn.held.push(hold())
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
  modelId: ModelId,
): Promise<Picked | undefined> {
  for (;;) {
    const found = await nextRow(deps, turn, modelId)
    if (found === undefined) return undefined
    try {
      return await pickedOf(deps, turn, found, modelId)
    } catch (error) {
      if (!(error instanceof Failure)) throw error
      logFailure(deps.log, error, { companyId: turn.companyId, accountId: found.row.id })
      turn.tried.add(found.row.id)
      if (error.code === 'MODEL_ACCOUNT_REFUSED') {
        await markAccount(deps, turn, found.row.id, { kind: 'refused' })
        turn.unsaid.push(found.row.label)
      }
    }
  }
}

/**
 * The provider's refusal kept on the account (study D3, security S34): a limit until its time, a
 * refusal as `refused`, which the account screen shows "Ligue de novo". The same mark twice is the
 * same row; with the database out, the account goes unmarked and its failure is logged.
 */
export async function markAccount(
  deps: QueueDeps,
  turn: Turn,
  accountId: ModelAccountId,
  failure: AccountFailure,
): Promise<void> {
  if (failure.kind === 'missing') return readServedAgain(deps, turn, accountId)
  const set =
    failure.kind === 'limited' ? { limitedUntil: failure.until } : { state: 'refused' as const }
  try {
    await deps.database.command(scopeOf(turn), (tx) =>
      tx
        .update(modelAccount)
        .set(set)
        .where(and(eq(modelAccount.id, accountId), eq(modelAccount.companyId, turn.companyId))),
    )
    const code = failure.kind === 'limited' ? 'MODEL_ACCOUNT_LIMITED' : 'MODEL_ACCOUNT_REFUSED'
    deps.log.info({ companyId: turn.companyId, accountId }, code)
  } catch (error) {
    if (!(error instanceof Failure) || error.code !== 'DATABASE_UNAVAILABLE') throw error
    logFailure(deps.log, error)
  }
}

/**
 * A provider that answered "not found" for the model says the list it serves has changed: reads it
 * again with the account's credential. The account is not marked; the models it serves now decide
 * whether the queue keeps it for this one.
 */
async function readServedAgain(deps: QueueDeps, turn: Turn, accountId: ModelAccountId) {
  await readServedOf(deps, scopeOf(turn), turn.companyId, accountId, (tx) =>
    admitted(deps, tx, turn),
  )
}
