import type { CompanyId, ConversationId, Effort, ModelId } from '@conexus/hub-api'
import type { AgentController } from '@mastra/core/agent-controller'
import type { QueueDeps } from '../../harness/model-accounts/public.ts'
import { answer } from '../../platform/http.ts'
import type { ControllerKind, Owner } from './kinds.ts'
import { changeModel } from './open.ts'

/**
 * The body of the route that puts a conversation on a model and effort (`…/model`), the same for
 * the Builder, the Assistant and the Construtor: the agent's own admission (`owned`) finds the
 * conversation and the marks a recovered session carries, else refuses (security S10); then
 * `changeModel`; then the agent's log line (`logged`). Each agent's route stays concrete and calls
 * this from its own `serve`: the types `serve` gives a handler depend on the operation and do not
 * resolve inside a generic function.
 */
export async function answerModelChange(
  deps: {
    kind: ControllerKind
    controller: AgentController
    queue: QueueDeps
    owned: () => Promise<{ owner: Owner; id: ConversationId; tags?: Record<string, string> }>
    logged: (about: { companyId: CompanyId; conversationId: ConversationId }) => void
  },
  choice: { model: ModelId; effort: Effort },
) {
  const { owner, id, tags } = await deps.owned()
  const kept = await changeModel(deps, {
    kind: deps.kind,
    owner,
    id,
    ...(tags === undefined ? {} : { tags }),
    choice,
  })
  deps.logged({ companyId: owner.companyId, conversationId: id })
  return answer(kept)
}
