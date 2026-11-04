import type { ConstrutorConversationSummary } from '@conexus/hub-api'
import {
  ConversationId,
  createConstrutorConversation,
  listConstrutorConversations,
  setConstrutorModel,
} from '@conexus/hub-api'
import type { AgentController } from '@mastra/core/agent-controller'
import type { StorageThreadType } from '@mastra/core/memory'
import type { Memory } from '@mastra/memory'
import type { FastifyInstance } from 'fastify'
import type { Database } from '../../platform/database.ts'
import type { FailureLog } from '../../platform/failure.ts'
import { Failure } from '../../platform/failure.ts'
import { answer, serve } from '../../platform/http.ts'
import { attemptIdOf, changeModel, resourceOf } from '../controller-kit/public.ts'
import type { QueueDeps } from '../model-accounts/public.ts'
import type { InProject, ToolsDeps } from '../tools/public.ts'
import { admitted, databaseScopeOf, inProjectOf } from '../tools/public.ts'
import { CONSTRUTOR_MARK, openConstrutor, threadOf } from './open.ts'

type Deps = Pick<ToolsDeps, 'identity' | 'liveProjectOf'> & {
  database: Database
  queue: QueueDeps
  conversations: { controller: AgentController; memory: Memory }
  log: FailureLog
}

/** The person may manage the Projeto's agents, which the Construtor builds, and the Projeto is live. */
function admittedTo(deps: Deps, scope: InProject) {
  return deps.database.command(databaseScopeOf(scope), (tx) =>
    admitted(deps, tx, scope, 'manageAgents'),
  )
}

function summaryOf(thread: StorageThreadType): ConstrutorConversationSummary {
  return {
    id: ConversationId.parse(thread.id),
    title: thread.title ?? '',
    updatedAt: thread.updatedAt.toISOString(),
  }
}

/**
 * The Construtor's conversations (step 24.3, U4): the person's own in one Projeto, which they may
 * open and list while they manage its agents; a member's request is the same `NOT_FOUND`.
 */
export function registerConstrutorRoutes(app: FastifyInstance, deps: Deps): void {
  const { controller, memory } = deps.conversations
  serve(app, createConstrutorConversation, async (input) => {
    const scope = inProjectOf(input)
    await admittedTo(deps, scope)
    const owner = { companyId: scope.companyId, personId: scope.personId }
    const id = attemptIdOf('construtor', owner, input.attemptKey)
    const { model, effort } = input.body
    const opened = await openConstrutor(
      { ...deps, controller, memory },
      { scope, id, model, effort },
    )
    const thread = await threadOf(memory, owner, id)
    if (opened.made) {
      const about = { companyId: scope.companyId, traceId: input.traceId, conversationId: id }
      deps.log.info(about, 'CONSTRUTOR_CONVERSATION_CREATED')
    }
    return answer({ conversation: summaryOf(thread) })
  })

  serve(app, listConstrutorConversations, async (input) => {
    const scope = inProjectOf(input)
    await admittedTo(deps, scope)
    const owner = { companyId: scope.companyId, personId: scope.personId }
    const { threads } = await memory.listThreads({
      filter: {
        resourceId: resourceOf('construtor', owner),
        metadata: { [CONSTRUTOR_MARK.project]: scope.projectId },
      },
      perPage: false,
      orderBy: { field: 'updatedAt', direction: 'DESC' },
    })
    return answer({ conversations: threads.map(summaryOf) })
  })

  serve(app, setConstrutorModel, async (input) => {
    const scope = inProjectOf(input)
    await admittedTo(deps, scope)
    const owner = { companyId: scope.companyId, personId: scope.personId }
    const { conversationId } = input.params
    const thread = await threadOf(memory, owner, conversationId)
    if (thread.metadata?.[CONSTRUTOR_MARK.project] !== scope.projectId)
      throw new Failure('CONVERSATION_NOT_FOUND')
    const kept = await changeModel(
      { controller, queue: deps.queue },
      { kind: 'construtor', owner, id: conversationId, choice: input.body },
    )
    const about = { companyId: scope.companyId, traceId: input.traceId, conversationId }
    deps.log.info(about, 'CONSTRUTOR_MODEL_SET')
    return answer(kept)
  })
}
