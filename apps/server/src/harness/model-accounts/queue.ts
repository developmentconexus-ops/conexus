import type { ModelAccountId, ModelId, SubscriptionKind } from '@conexus/hub-api'
import type { LanguageModel, MastraModelConfig } from '@mastra/core/llm'
import { PROVIDER_REGISTRY, parseModelString, resolveModelConfig } from '@mastra/core/llm'
import { and, asc, eq } from 'drizzle-orm'
import type { IdentityPorts } from '../../hub/identity/public.ts'
import type { Database, ReadTx, Scope } from '../../platform/database.ts'
import type { FailureLog } from '../../platform/failure.ts'
import { Failure, logFailure } from '../../platform/failure.ts'
import type { Credential, SealKeys } from '../../platform/seal.ts'
import type { Access } from './access.ts'
import { accessOf } from './access.ts'
import { AccountRow, columns, contextOf, credentialOf, inOrder, usableInOrder } from './accounts.ts'
import type { PromptCacheScope } from './claude/models.ts'
import { apiKeyModel, subscriptionModel } from './claude/models.ts'
import { refreshAnthropicTokens } from './claude/sign-in.ts'
import type { AccountFailure } from './errors.ts'
import type { GoogleCalls } from './google/port.ts'
import { CodexTokens, codexModel } from './openai/models.ts'
import { codexRenewal } from './openai/sign-in.ts'
import { isChoosable } from './providers.ts'
import { readServedOf, servesModel } from './served.ts'
import type { Renewal } from './subscription-store.ts'
import { subscriptionAccess } from './subscription-store.ts'
import { modelAccount } from './tables.ts'
import type { AccountTurn, Picked } from './turn.ts'

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

function scopeOf(turn: AccountTurn): Scope {
  return { kind: 'COMPANY', companyId: turn.companyId, personId: turn.personId }
}

export type Asker = {
  companyId: AccountTurn['companyId']
  personId: AccountTurn['personId']
  tried: ReadonlySet<ModelAccountId>
}

/**
 * The provider's accounts that serve the model and that the person may use now, in their order
 * (`usableInOrder`), less those this turn tried. The caller admitted the person.
 */
async function queuedRows(tx: ReadTx, asker: Asker, model: ModelId): Promise<AccountRow[]> {
  const { rows, context } = await providerRows(tx, asker, model)
  return usableInOrder(rows, context, asker.personId).filter(
    (row) => servesModel(row, model) && !asker.tried.has(row.id),
  )
}

async function providerRows(tx: ReadTx, asker: Asker, model: ModelId) {
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
  return { rows: rows.map((row) => AccountRow.parse(row)), context }
}

/** The person's access to `model` (`accessOf`), every account counted; the caller admitted the person. */
async function accessIn(tx: ReadTx, asker: Asker, model: ModelId): Promise<Access> {
  const { rows, context } = await providerRows(tx, asker, model)
  return accessOf(inOrder(rows, context, asker.personId), context, model)
}

/** The access at the turn's end, read in a transaction that admits the person (security S32). */
export function accessNow(deps: QueueDeps, turn: AccountTurn, model: ModelId): Promise<Access> {
  return deps.database.read(scopeOf(turn), async (tx) => {
    await admitted(deps, tx, turn)
    return accessIn(tx, turn, model)
  })
}

export function admitted(deps: Pick<QueueDeps, 'identity'>, tx: ReadTx, asker: Asker) {
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
async function nextRow(deps: QueueDeps, turn: AccountTurn, model: ModelId) {
  return deps.database.read(scopeOf(turn), async (tx) => {
    await admitted(deps, tx, turn)
    const [first] = await queuedRows(tx, turn, model)
    if (first === undefined) return undefined
    const credential = await credentialOf(deps, tx, { ...first, companyId: turn.companyId })
    return { row: first, credential }
  })
}

/**
 * Whether the person has an account for the model, one to call now or one waiting in a limit, out
 * of credit or refused.
 */
export async function hasAccount(tx: ReadTx, who: Asker, model: ModelId): Promise<boolean> {
  return (await accessIn(tx, who, model)).kind !== 'none'
}

/**
 * The model a conversation changes to: one the picker does not offer is `MODEL_UNKNOWN`, and one
 * the person has no account for is `MODEL_NO_ACCOUNT` (`hasAccount`). No credential is opened.
 */
export async function conversationModel(
  deps: QueueDeps,
  asker: { companyId: AccountTurn['companyId']; personId: AccountTurn['personId'] },
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

/** A Claude account's model once per cache scope, each wrapped with its own marks. */
async function byScope(build: (scope: PromptCacheScope) => MastraModelConfig) {
  const [conversation, system] = await Promise.all([
    callModel(build('conversation')),
    callModel(build('system')),
  ])
  return { conversation, system }
}

async function pickedOf(
  deps: QueueDeps,
  turn: AccountTurn,
  found: { row: AccountRow; credential: Credential },
  modelId: ModelId,
): Promise<Picked> {
  const { row, credential } = found
  const { modelId: name } = parseModelString(modelId)
  const base = { id: row.id, label: row.label, kind: row.kind, modelId }
  const target = { providerId: row.provider, modelId: name }
  function access(kind: SubscriptionKind, renew: Renewal) {
    const account = { ...row, kind, companyId: turn.companyId, credential }
    return subscriptionAccess(
      { ...deps, scope: scopeOf(turn) },
      account,
      renew,
      turn.refreshed.has(row.id),
    )
  }
  switch (row.kind) {
    case 'claude_subscription': {
      const { access: token } = await access(row.kind, refreshAnthropicTokens)
      return { ...base, models: await byScope((scope) => subscriptionModel(name, token, scope)) }
    }
    case 'openai_codex': {
      const tokens = await access(row.kind, codexRenewal)
      const model = await callModel(codexModel(name, CodexTokens.parse(tokens)))
      return { ...base, models: { conversation: model, system: model } }
    }
    case 'google_cliproxy': {
      const { url, apiKey, hold } = await deps.googleCalls(
        { ...row, companyId: turn.companyId, credential },
        scopeOf(turn),
      )
      turn.hold(hold())
      const model = await callModel({ ...target, url, apiKey })
      return { ...base, models: { conversation: model, system: model } }
    }
    case 'api_key': {
      const apiKey = credential.reveal()
      if (row.provider === 'anthropic')
        return { ...base, models: await byScope((scope) => apiKeyModel(name, apiKey, scope)) }
      const model = await callModel({ ...target, apiKey })
      return { ...base, models: { conversation: model, system: model } }
    }
    default:
      return row.kind satisfies never
  }
}

/**
 * The account for the next attempt of `modelId` in this turn, or none left. A subscription whose
 * refresh is refused is marked refused and the next one is taken, as a refused call would be.
 */
export async function pickAccount(
  deps: QueueDeps,
  turn: AccountTurn,
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
  turn: AccountTurn,
  accountId: ModelAccountId,
  failure: AccountFailure,
): Promise<void> {
  if (failure.kind === 'missing') return readServedAgain(deps, turn, accountId)
  const set =
    failure.kind === 'limited'
      ? { limitedUntil: failure.until, limitReason: failure.reason }
      : { state: 'refused' as const }
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
async function readServedAgain(deps: QueueDeps, turn: AccountTurn, accountId: ModelAccountId) {
  await readServedOf(deps, scopeOf(turn), turn.companyId, accountId, (tx) =>
    admitted(deps, tx, turn),
  )
}
