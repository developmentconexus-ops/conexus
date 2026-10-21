import type { ConversationStart, ModelAccountId, ModelId } from '@conexus/hub-api'
import { ModelDefault } from '@conexus/hub-api'
import { and, eq } from 'drizzle-orm'
import type { ReadTx, Scope } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import type { AccountRow } from './accounts.ts'
import { accountsOf, usableForAll, usableInOrder } from './accounts.ts'
import { isChoosable, STARTER_MODELS } from './providers.ts'
import type { QueueDeps } from './queue.ts'
import { admitted, hasAccount, providerOf } from './queue.ts'
import { companyModel, personModelDefault } from './tables.ts'
import { effortFor } from './thinking.ts'
import type { Turn } from './turn.ts'

type Who = { companyId: Turn['companyId']; personId: Turn['personId'] }
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
 * The first step whose provider has an account to call, with that account's name, the level
 * descended to one the model takes. A model the picker does not offer is skipped like a provider
 * with no account.
 */
function firstStep(
  steps: readonly Step[],
  rows: AccountRow[],
  usableOf: (queue: AccountRow[]) => AccountRow[],
): ConversationStart | null {
  for (const step of steps) {
    if (!isChoosable(step.model)) continue
    const provider = providerOf(step.model)
    const [first] = usableOf(rows.filter((row) => row.provider === provider))
    if (first !== undefined)
      return { ...step, effort: effortFor(step.model, step.effort), account: first.label }
  }
  return null
}

function starters(): Step[] {
  return STARTER_MODELS.map((model) => ({ model, effort: 'off', from: 'starter' }))
}

/**
 * Where a new conversation begins when nothing was asked, the one owner of the order (code C26):
 * for the person, their default, the company's, then the first starter model; for the company's
 * people alike, the company's, then the starters, over the accounts given to all. A step whose
 * provider has no account to call is skipped, and the level descends to one the model takes.
 */
export async function startsOf(tx: ReadTx, who: Who) {
  const saved = await savedDefaults(tx, who)
  const { rows, context } = await accountsOf(tx, who.companyId)
  const company: Step[] = saved.company === null ? [] : [{ ...saved.company, from: 'company' }]
  const mine: Step[] = saved.mine === null ? [] : [{ ...saved.mine, from: 'mine' }]
  return {
    start: firstStep([...mine, ...company, ...starters()], rows, (queue) =>
      usableInOrder(queue, context, who.personId),
    ),
    companyStart: firstStep([...company, ...starters()], rows, (queue) =>
      usableForAll(queue, context),
    ),
  }
}

/**
 * The model and level a conversation is created on. With no model asked, the person's start, or
 * `MODEL_NO_ACCOUNT` when no step has an account. With one: it must be a model the picker offers
 * (`MODEL_UNKNOWN`) with an account the person may use now (`MODEL_NO_ACCOUNT`), and it keeps the
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
