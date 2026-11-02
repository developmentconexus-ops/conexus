import type {
  CompanyId,
  ModelAccountId,
  ObservationalMemoryRole,
  Person,
  PersonId,
} from '@conexus/hub-api'
import {
  ObservationalMemoryModels,
  readObservationalMemoryModels,
  setObservationalMemoryModel,
} from '@conexus/hub-api'
import { eq } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'
import { Failure, logFailure } from '../../platform/failure.ts'
import { answer, serve } from '../../platform/http.ts'
import { isChoosable } from './providers.ts'
import type { QueueDeps } from './queue.ts'
import { admitted, hasAccount } from './queue.ts'
import { observationalMemoryModels } from './tables.ts'
import type { MemoryChoice, MemoryModels } from './turn.ts'
import { FOLLOW_CONVERSATION } from './turn.ts'

type Deps = Pick<QueueDeps, 'database' | 'identity' | 'log'>
type InCompany = { person: Person; params: { companyId: CompanyId } }

function scopeOf(input: InCompany) {
  return { kind: 'COMPANY' as const, companyId: input.params.companyId, personId: input.person.id }
}

async function rowOf(tx: Parameters<typeof hasAccount>[0], companyId: CompanyId) {
  const [row] = await tx
    .select({
      observer: observationalMemoryModels.observer,
      reflector: observationalMemoryModels.reflector,
    })
    .from(observationalMemoryModels)
    .where(eq(observationalMemoryModels.companyId, companyId))
  // A company with no row never chose: Automatic. A stored null is its choice to follow.
  return row === undefined
    ? { observer: 'auto' as const, reflector: 'auto' as const }
    : {
        observer: ObservationalMemoryModels.shape.observer.parse(row.observer),
        reflector: ObservationalMemoryModels.shape.reflector.parse(row.reflector),
      }
}

/**
 * The company's two choices for the person's turn, read once as the turn opens, as Factory loads
 * them into the request (`memory-settings-hydration.ts:49-53`). A choice the person has no account
 * for, or any failure to read, follows the conversation's model, without a notice.
 */
export async function memoryModelsFor(
  deps: Deps,
  owner: { companyId: CompanyId; personId: PersonId },
): Promise<MemoryModels> {
  try {
    return await deps.database.read({ kind: 'COMPANY', ...owner }, async (tx) => {
      const who = { ...owner, tried: new Set<ModelAccountId>() }
      await admitted(deps, tx, who)
      const chosen = await rowOf(tx, owner.companyId)
      // Automatic is checked per call, against the cheap model of the conversation's provider.
      async function usable(choice: MemoryChoice) {
        if (choice === null || choice === 'auto') return choice
        return isChoosable(choice) && (await hasAccount(tx, who, choice)) ? choice : null
      }
      return { observer: await usable(chosen.observer), reflector: await usable(chosen.reflector) }
    })
  } catch (error) {
    if (!(error instanceof Failure)) throw error
    logFailure(deps.log, error, owner)
    return FOLLOW_CONVERSATION
  }
}

async function readModels(deps: Deps, input: InCompany) {
  return deps.database.read(scopeOf(input), async (tx) => {
    await deps.identity.admitMember({
      tx,
      personId: input.person.id,
      companyId: input.params.companyId,
      action: 'readModelAccounts',
    })
    return rowOf(tx, input.params.companyId)
  })
}

/** Admits the manager, checks the model like a conversation's change, and saves, in one transaction. */
async function setModel(
  deps: Deps,
  input: InCompany & {
    body: { role: ObservationalMemoryRole; model: ObservationalMemoryModels['observer'] }
  },
) {
  const { person, params, body } = input
  await deps.database.command(scopeOf(input), async (tx) => {
    await deps.identity.admitMember({
      tx,
      personId: person.id,
      companyId: params.companyId,
      action: 'manageModelAccounts',
    })
    if (body.model !== null && body.model !== 'auto') {
      if (!isChoosable(body.model)) throw new Failure('MODEL_UNKNOWN')
      const who = {
        companyId: params.companyId,
        personId: person.id,
        tried: new Set<ModelAccountId>(),
      }
      if (!(await hasAccount(tx, who, body.model))) throw new Failure('MODEL_NO_ACCOUNT')
    }
    await tx
      .insert(observationalMemoryModels)
      // The other role of a new row is Automatic, as it read before the row: only the existing
      // rows' null is a choice to follow.
      .values({
        companyId: params.companyId,
        observer: 'auto',
        reflector: 'auto',
        [body.role]: body.model,
      })
      .onConflictDoUpdate({
        target: observationalMemoryModels.companyId,
        set: { [body.role]: body.model },
      })
  })
  return readModels(deps, input)
}

export function registerObservationalMemoryModelRoutes(app: FastifyInstance, deps: Deps): void {
  serve(app, readObservationalMemoryModels, async (input) => answer(await readModels(deps, input)))
  serve(app, setObservationalMemoryModel, async (input) => {
    const saved = await setModel(deps, input)
    input.log.info(
      { by: input.person.id, companyId: input.params.companyId, role: input.body.role },
      'OBSERVATIONAL_MEMORY_MODEL_SET',
    )
    return answer(saved)
  })
}
