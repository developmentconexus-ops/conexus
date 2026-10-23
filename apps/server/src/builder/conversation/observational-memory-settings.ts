import type {
  CompanyId,
  ModelId,
  ObservationalMemoryRole,
  Person,
  PersonId,
} from '@conexus/hub-api'
import {
  ModelId as ParsedModelId,
  readObservationalMemoryModels,
  setObservationalMemoryModel,
} from '@conexus/hub-api'
import { eq } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'
import { answer, serve } from '../../platform/http.ts'
import type { QueueDeps } from '../model-accounts/public.ts'
import { conversationModel } from '../model-accounts/public.ts'
import { observationalMemoryModels } from './tables.ts'

export async function configuredMemoryModel(
  deps: QueueDeps,
  owner: { companyId: CompanyId; personId: PersonId },
  role: ObservationalMemoryRole,
): Promise<ModelId | null> {
  return deps.database.read(
    { kind: 'COMPANY', companyId: owner.companyId, personId: owner.personId },
    async (tx) => {
      await deps.identity.admitMember({ ...owner, tx, action: 'useConversations' })
      const [row] = await tx
        .select({ model: observationalMemoryModels[role] })
        .from(observationalMemoryModels)
        .where(eq(observationalMemoryModels.companyId, owner.companyId))
      return row?.model === null || row?.model === undefined ? null : ParsedModelId.parse(row.model)
    },
  )
}

function scopeOf(input: { person: Person; params: { companyId: CompanyId } }) {
  return { kind: 'COMPANY' as const, companyId: input.params.companyId, personId: input.person.id }
}

async function readModels(
  deps: QueueDeps,
  input: { person: Person; params: { companyId: CompanyId } },
) {
  return deps.database.read(scopeOf(input), async (tx) => {
    await deps.identity.admitMember({
      tx,
      personId: input.person.id,
      companyId: input.params.companyId,
      action: 'readModelAccounts',
    })
    const [row] = await tx
      .select({
        observer: observationalMemoryModels.observer,
        reflector: observationalMemoryModels.reflector,
      })
      .from(observationalMemoryModels)
      .where(eq(observationalMemoryModels.companyId, input.params.companyId))
    return { observer: row?.observer ?? null, reflector: row?.reflector ?? null }
  })
}

async function setModel(
  deps: QueueDeps,
  input: {
    person: Person
    params: { companyId: CompanyId }
    body: { role: ObservationalMemoryRole; model: ModelId | null }
  },
) {
  const { person, params, body } = input
  await deps.database.read(scopeOf(input), (tx) =>
    deps.identity.admitMember({
      tx,
      personId: person.id,
      companyId: params.companyId,
      action: 'manageModelAccounts',
    }),
  )
  if (body.model !== null) {
    await conversationModel(deps, { companyId: params.companyId, personId: person.id }, body.model)
  }
  await deps.database.command(scopeOf(input), async (tx) => {
    await deps.identity.admitMember({
      tx,
      personId: person.id,
      companyId: params.companyId,
      action: 'manageModelAccounts',
    })
    const values: { companyId: CompanyId; observer: ModelId | null; reflector: ModelId | null } = {
      companyId: params.companyId,
      observer: null,
      reflector: null,
    }
    values[body.role] = body.model
    await tx
      .insert(observationalMemoryModels)
      .values(values)
      .onConflictDoUpdate({
        target: observationalMemoryModels.companyId,
        set: { [body.role]: body.model },
      })
  })
  return readModels(deps, input)
}

export function registerObservationalMemoryModelRoutes(
  app: FastifyInstance,
  deps: QueueDeps,
): void {
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
