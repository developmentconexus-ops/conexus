import type { ModelAccountId, ModelId, StartSource } from '@conexus/hub-api'
import { ModelDefault } from '@conexus/hub-api'
import { and, eq } from 'drizzle-orm'
import type { ReadTx, Scope } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import { isRegistryModel, STARTER_MODELS } from './providers.ts'
import type { Asker, QueueDeps } from './queue.ts'
import { admitted, providerOf, queuedRows } from './queue.ts'
import { companyModel, personModelDefault } from './tables.ts'
import { effortFor } from './thinking.ts'
import type { Turn } from './turn.ts'

/** What a new conversation begins on, and which step of the order it came from (card 12.3, P3). */
export type Start = ModelDefault & { from: StartSource }

type Who = { companyId: Turn['companyId']; personId: Turn['personId'] }

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

async function usable(tx: ReadTx, who: Asker, model: ModelId): Promise<boolean> {
  return isRegistryModel(model) && (await queuedRows(tx, who, providerOf(model))).length > 0
}

/**
 * Where a conversation begins when nothing was asked, the one owner of the order (code C26): the
 * person's default, the company's, then the first starter model; a step whose provider has no
 * account the person may call now is skipped, and the level descends to one the model takes. None
 * left is `null`.
 */
export async function startOf(tx: ReadTx, who: Who): Promise<Start | null> {
  const asker = { ...who, tried: new Set<ModelAccountId>() }
  const saved = await savedDefaults(tx, who)
  const steps: Start[] = [
    ...(saved.mine === null ? [] : [{ ...saved.mine, from: 'mine' as const }]),
    ...(saved.company === null ? [] : [{ ...saved.company, from: 'company' as const }]),
    ...STARTER_MODELS.map((model) => ({ model, effort: 'off' as const, from: 'starter' as const })),
  ]
  for (const step of steps) {
    if (await usable(tx, asker, step.model))
      return { ...step, effort: effortFor(step.model, step.effort) }
  }
  return null
}

/**
 * The model and level a conversation is created on. With no model asked, `startOf`, or
 * `MODEL_NO_ACCOUNT` when no step has an account. With one: it must be in the registry
 * (`MODEL_UNKNOWN`) and have an account the person may use now (`MODEL_NO_ACCOUNT`), and it keeps
 * the level the person saved for that model, else the company's, else the lowest it takes.
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
      const start = await startOf(tx, who)
      if (start === null) throw new Failure('MODEL_NO_ACCOUNT')
      return { model: start.model, effort: start.effort }
    }
    if (!isRegistryModel(asked)) throw new Failure('MODEL_UNKNOWN')
    if (!(await usable(tx, asker, asked))) throw new Failure('MODEL_NO_ACCOUNT')
    const saved = await savedDefaults(tx, who)
    const kept = [saved.mine, saved.company].find((each) => each?.model === asked)
    return { model: asked, effort: effortFor(asked, kept?.effort ?? 'off') }
  })
}
