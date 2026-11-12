import { clearProfileMemory, getProfileMemory, setProfileMemory } from '@conexus/hub-api'
import type { FastifyInstance } from 'fastify'
import type { IdentityPorts } from '../../hub/identity/public.ts'
import type { Database } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import { answer, serve } from '../../platform/http.ts'
import { resourceOf } from '../controller-kit/public.ts'
import type { Owner } from './context.ts'
import type { assistantMemory } from './memory.ts'
import { PROFILE_TEMPLATE } from './memory.ts'
import { admitted } from './open.ts'
import type { AssistantProjects } from './ports.ts'

type Deps = {
  database: Database
  identity: IdentityPorts
  projects: Pick<AssistantProjects, 'liveProjectOf'>
  memory: ReturnType<typeof assistantMemory>
}

/**
 * The person's working memory in the company, by their resource and their latest conversation:
 * Mastra's calls take a thread in their type and do not read it for a resource's memory; with no
 * conversation, `undefined`.
 */
async function profileOf(deps: Deps, owner: Owner) {
  await admitted(deps, owner, { kind: 'COMPANY' }, 'askAssistant')
  const resourceId = resourceOf('assistant', owner)
  const { threads } = await deps.memory.listThreads({
    filter: { resourceId },
    perPage: 1,
    orderBy: { field: 'updatedAt', direction: 'DESC' },
  })
  const latest = threads[0]
  return latest === undefined ? undefined : { threadId: latest.id, resourceId }
}

async function written(deps: Deps, owner: Owner, workingMemory: string) {
  const profile = await profileOf(deps, owner)
  if (profile === undefined) throw new Failure('NOT_FOUND', { details: { reason: 'NO_CONVERSATION' } })
  await deps.memory.updateWorkingMemory({ ...profile, workingMemory })
}

/**
 * "O que o Assistente lembra de você" (U7): the person reads, replaces and erases the
 * text the model keeps about them. The resource comes from the session alone (code C23); the
 * template, as erasing leaves it, reads as nothing kept.
 */
export function registerProfileMemoryRoutes(app: FastifyInstance, deps: Deps): void {
  serve(app, getProfileMemory, async (input) => {
    const owner = { companyId: input.params.companyId, personId: input.person.id }
    const profile = await profileOf(deps, owner)
    const text = profile === undefined ? null : await deps.memory.getWorkingMemory(profile)
    return answer({ text: text === null || text.trim() === PROFILE_TEMPLATE ? null : text })
  })

  serve(app, setProfileMemory, async (input) => {
    const { text } = input.body
    await written(deps, { companyId: input.params.companyId, personId: input.person.id }, text)
    return answer({ text })
  })

  serve(app, clearProfileMemory, async (input) => {
    const owner = { companyId: input.params.companyId, personId: input.person.id }
    await written(deps, owner, PROFILE_TEMPLATE)
    return answer(undefined)
  })
}
