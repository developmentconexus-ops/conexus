import type { ConversationStart, ModelAccountId, ModelId } from '@conexus/hub-api'
import { ModelDefault } from '@conexus/hub-api'
import { and, eq } from 'drizzle-orm'
import type { ReadTx, Scope } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import type { Access } from './access.ts'
import { accessOf } from './access.ts'
import type { AccountRow, Context } from './accounts.ts'
import { accountsOf, inOrder } from './accounts.ts'
import { isChoosable, STARTER_MODELS } from './providers.ts'
import type { QueueDeps } from './queue.ts'
import { admitted, hasAccount, providerOf } from './queue.ts'
import { companyModel, personModelDefault } from './tables.ts'
import { effortFor } from './thinking.ts'
import type { AccountTurn } from './turn.ts'

type Who = { companyId: AccountTurn['companyId']; personId: AccountTurn['personId'] }
type Step = ModelDefault & { from: ConversationStart['from'] }

/** The company's default and the person's own, as saved; either may be none. */
export async function savedDefaults(tx: ReadTx, who: Who) {
  const [mine] = await tx
    .select({ model: personModelDefault.model, effort: personModelDefault.effort })
    .from(personModelDefault)
    .where(
      and(
        eq(personModelDefault.companyId, who.companyId),
        eq(personModelDefault.personId, who.personId),
      ),
    )
  const [company] = await tx
    .select({ model: companyModel.model, effort: companyModel.effort })
    .from(companyModel)
    .where(eq(companyModel.companyId, who.companyId))
  return {
    mine: mine === undefined ? null : ModelDefault.parse(mine),
    company: company === undefined ? null : ModelDefault.parse(company),
  }
}

/**
 * The first step with an account to call now, with that account's name, the level descended to one
 * the model takes; with none, the first step with an account that waits (`accessOf`). A model the picker does not offer is
 * skipped like a provider with no account.
 */
function firstStep(
  steps: readonly Step[],
  accessFor: (model: ModelId) => Access,
): ConversationStart | null {
  const reached = steps
    .filter((step) => isChoosable(step.model))
    .map((step) => ({ step, access: accessFor(step.model) }))
  const found =
    reached.find((each) => each.access.kind === 'usable') ??
    reached.find((each) => each.access.kind !== 'none')
  if (found === undefined || found.access.kind === 'none') return null
  const { step, access } = found
  return { ...step, effort: effortFor(step.model, step.effort), account: access.account.label }
}

function ofProvider(rows: AccountRow[], model: ModelId): AccountRow[] {
  return rows.filter((row) => row.provider === providerOf(model))
}

function forAll(rows: AccountRow[], context: Context): AccountRow[] {
  return rows
    .filter((row) => row.personId === null && !context.assignees.has(row.id))
    .sort((left, right) => left.position - right.position)
}

function starters(): Step[] {
  return STARTER_MODELS.map((model) => ({ model, effort: 'off', from: 'starter' }))
}

/**
 * Where a new conversation begins when nothing was asked, the one owner of the order (code C26):
 * for the person, their default, the company's, then the first starter model; for the company's
 * people alike, the company's, then the starters, over the accounts given to all (`firstStep`).
 */
export async function startsOf(tx: ReadTx, who: Who) {
  const saved = await savedDefaults(tx, who)
  const { rows, context } = await accountsOf(tx, who.companyId)
  const company: Step[] = saved.company === null ? [] : [{ ...saved.company, from: 'company' }]
  const mine: Step[] = saved.mine === null ? [] : [{ ...saved.mine, from: 'mine' }]
  return {
    start: firstStep([...mine, ...company, ...starters()], (model) =>
      accessOf(inOrder(ofProvider(rows, model), context, who.personId), context, model),
    ),
    companyStart: firstStep([...company, ...starters()], (model) =>
      accessOf(forAll(ofProvider(rows, model), context), context, model),
    ),
  }
}

/**
 * The model and level a conversation is created on. With no model asked, the person's start, or
 * `MODEL_NO_ACCOUNT` when no step has an account. With one: it must be a model the picker offers
 * (`MODEL_UNKNOWN`) with an account the person has (`MODEL_NO_ACCOUNT`, `hasAccount`), and it keeps the
 * level the person saved for that model, else the company's, else the lowest it takes.
 */
export async function conversationStart(
  deps: QueueDeps,
  who: Who,
  asked: ModelId | undefined,
): Promise<ModelDefault> {
  const scope: Scope = { kind: 'COMPANY', ...who }
  return deps.database.read(scope, async (tx) => {
    const asker = { ...who, tried: new Set<ModelAccountId>() }
    await admitted(deps, tx, asker)
    if (asked === undefined) {
      const { start } = await startsOf(tx, who)
      if (start === null) throw new Failure('MODEL_NO_ACCOUNT')
      return { model: start.model, effort: start.effort }
    }
    if (!isChoosable(asked)) throw new Failure('MODEL_UNKNOWN')
    if (!(await hasAccount(tx, asker, asked))) throw new Failure('MODEL_NO_ACCOUNT')
    const saved = await savedDefaults(tx, who)
    const kept = [saved.mine, saved.company].find((each) => each?.model === asked)
    return { model: asked, effort: effortFor(asked, kept?.effort ?? 'off') }
  })
}
