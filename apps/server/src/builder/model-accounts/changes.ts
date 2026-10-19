import type { ModelAccountId, Owner, PersonId, ProviderId } from '@conexus/hub-api'
import { and, asc, eq, inArray } from 'drizzle-orm'
import { violatedReference } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import type { Deps, Viewer } from './accounts.ts'
import {
  AccountRow,
  accountView,
  admitFor,
  columns,
  contextOf,
  heldFor,
  labelOf,
  lockedRow,
  lockQueue,
  ofCompany,
  ofQueue,
  scopeOf,
  viewOf,
} from './accounts.ts'
import { isRegistryModel } from './providers.ts'
import { companyModel, modelAccount, modelAccountAssignee } from './tables.ts'

const ASSIGNEE_MEMBER_KEY = 'model_account_assignee_member_fkey'

export type Change = Viewer & {
  accountId: ModelAccountId
  revision: number
  label?: string | undefined
  state?: 'ready' | 'paused' | undefined
}

/** Renames, pauses or resumes, at the revision read (code C38); a refused account is linked again. */
export function change(deps: Deps, input: Change) {
  return deps.database.command(scopeOf(input), async (tx) => {
    const row = await heldFor(deps, tx, input, input.accountId)
    if (row === undefined) throw new Failure('NOT_FOUND')
    if (row.revision !== input.revision) throw new Failure('MODEL_ACCOUNT_STALE')
    if (input.state !== undefined && row.state === 'refused')
      throw new Failure('MODEL_ACCOUNT_INVALID', { details: { reason: 'REFUSED' } })
    const label = input.label === undefined ? row.label : labelOf(input.label)
    await tx
      .update(modelAccount)
      .set({ label, state: input.state ?? row.state, revision: row.revision + 1 })
      .where(ofCompany(input, row.id))
    return { account: await accountView(tx, input, row.id) }
  })
}

/**
 * Gives a company account to these people, the final list (P1, P3): with none, it is everyone's
 * again. Someone who is not a member is refused by the foreign key, as not found (S10).
 */
export function assign(
  deps: Deps,
  input: Viewer & { accountId: ModelAccountId; personIds: PersonId[] },
) {
  return deps.database.command(scopeOf(input), async (tx) => {
    await admitFor(deps, tx, input, 'company')
    const row = await lockedRow(tx, input, input.accountId)
    if (row === undefined) throw new Failure('NOT_FOUND')
    if (row.personId !== null) throw new Failure('MODEL_ACCOUNT_PERSONAL')
    await tx.delete(modelAccountAssignee).where(eq(modelAccountAssignee.accountId, row.id))
    const people = [...new Set(input.personIds)]
    if (people.length > 0) {
      try {
        await tx
          .insert(modelAccountAssignee)
          .values(
            people.map((personId) => ({ accountId: row.id, companyId: input.companyId, personId })),
          )
      } catch (error) {
        if (violatedReference(error) === ASSIGNEE_MEMBER_KEY)
          throw new Failure('NOT_FOUND', { details: { reason: 'NOT_A_MEMBER' }, cause: error })
        throw error
      }
    }
    await tx
      .update(modelAccount)
      .set({ revision: row.revision + 1 })
      .where(ofCompany(input, row.id))
    return { account: await accountView(tx, input, row.id) }
  })
}

/** Sets the company's default model, any of the registry (founder, C4). */
export function setDefault(deps: Deps, input: Viewer & { model: string }) {
  if (!isRegistryModel(input.model)) throw new Failure('MODEL_UNKNOWN')
  return deps.database.command(scopeOf(input), async (tx) => {
    await admitFor(deps, tx, input, 'company')
    await tx
      .insert(companyModel)
      .values({ companyId: input.companyId, model: input.model })
      .onConflictDoUpdate({ target: companyModel.companyId, set: { model: input.model } })
    return { defaultModel: input.model }
  })
}

/**
 * Orders one queue by every one of its ids (criterion 14). The queue's lock and its rows' locks make
 * two orders, or an order and a link, meet in turn; an order that misses an id, or names one from
 * elsewhere, read an old queue. The position's unique constraint is checked at commit.
 */
export function order(
  deps: Deps,
  input: Viewer & { owner: Owner; provider: ProviderId; ids: ModelAccountId[] },
) {
  return deps.database.command(scopeOf(input), async (tx) => {
    await admitFor(deps, tx, input, input.owner)
    const queue = {
      companyId: input.companyId,
      personId: input.owner === 'company' ? null : input.person.id,
      provider: input.provider,
    }
    await lockQueue(tx, queue)
    const rows = await tx
      .select({ id: modelAccount.id })
      .from(modelAccount)
      .where(ofQueue(queue))
      .for('update')
    const held = new Set(rows.map(({ id }) => id))
    if (
      new Set(input.ids).size !== input.ids.length ||
      input.ids.length !== held.size ||
      !input.ids.every((id) => held.has(id))
    )
      throw new Failure('MODEL_ACCOUNT_ORDER_STALE')
    for (const [position, id] of input.ids.entries()) {
      await tx.update(modelAccount).set({ position }).where(ofCompany(input, id))
    }
    if (input.ids.length === 0) return { accounts: [] }
    const ordered = await tx
      .select(columns)
      .from(modelAccount)
      .where(and(eq(modelAccount.companyId, input.companyId), inArray(modelAccount.id, input.ids)))
      .orderBy(asc(modelAccount.position))
    const context = await contextOf(tx, input.companyId)
    return { accounts: ordered.map((row) => viewOf(AccountRow.parse(row), context)) }
  })
}

/** Removes an account with its credential; one already gone answers the same (criterion 15). */
export function remove(deps: Deps, input: Viewer & { accountId: ModelAccountId }) {
  return deps.database.command(scopeOf(input), async (tx) => {
    const row = await heldFor(deps, tx, input, input.accountId)
    if (row === undefined) return { removed: undefined }
    await tx.delete(modelAccount).where(ofCompany(input, row.id))
    return { removed: { provider: row.provider } }
  })
}
