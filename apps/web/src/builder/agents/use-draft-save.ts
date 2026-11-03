import type { AgentDetail, AgentId, CompanyId, DraftPatch, ProjectId } from '@conexus/hub-api'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { HubFailure, writeFailureText } from '../../platform/hub.ts'
import { agentQuery, sendDraft } from './queries.ts'
import { reasonText, UNCONFIRMED_SAVE } from './text.ts'

type Fields = Omit<DraftPatch, 'revision'>

export type Saving = {
  /**
   * Writes the fields after the agent's earlier writes; a list is changed from the agent as it is
   * now, with the changes still on their way. `saved` runs once the Hub took them.
   */
  save: (change: Fields | ((now: AgentDetail) => Fields), saved?: () => void) => void
  pending: boolean
  /** This section's last refusal, from the Hub's own words, until the section saves again. */
  error: string | undefined
  /** The field that refusal named, and why. */
  refused: { field: string | undefined; reason: string | undefined } | undefined
}

/** The agent as the screen shows it while `fields` are on their way: what the next change starts from. */
function applied(agent: AgentDetail, fields: Fields): AgentDetail {
  const { tools, ready: _ready, ...draft } = fields
  return {
    ...agent,
    draft: { ...agent.draft, ...draft },
    tools:
      tools === undefined
        ? agent.tools
        : agent.tools.filter((one) => tools.includes(one.version.id)),
  }
}

/**
 * The writes of one section of an agent's draft (web W24, criterion 27). Every section's writes of
 * one agent share the mutation scope of that agent, so the library sends them one at a time, and
 * each reads the `revision` from the cache when it leaves: two sections saved in a row by the same
 * person never refuse each other. Each change is applied to the cached agent at once, so the next
 * change starts from it. Only a refusal from outside (`AGENT_DRAFT_STALE` of another writer) is
 * shown, beside the section that asked. The cache is read again only when the agent's last queued
 * write settles (web W12, the library's concurrent optimistic updates): a read in between would
 * drop the changes still waiting.
 */
export function useDraftSave(
  scope: { companyId: CompanyId; projectId: ProjectId },
  agentId: AgentId,
): Saving {
  const queryClient = useQueryClient()
  const { queryKey } = agentQuery(scope, agentId)
  function queued() {
    return queryClient.isMutating({ predicate: (one) => one.options.scope?.id === agentId })
  }
  function cached(): AgentDetail {
    const read = queryClient.getQueryData<{ agent: AgentDetail }>(queryKey)
    if (read === undefined) throw new Error(`the agent ${agentId} is saved while its page is read`)
    return read.agent
  }
  const send = useMutation({
    mutationKey: sendDraft.mutationKey,
    scope: { id: agentId },
    meta: { keepCache: true },
    mutationFn: (fields: Fields) =>
      sendDraft.mutationFn({
        params: { ...scope, agentId },
        body: { ...fields, revision: cached().revision },
      }),
    onMutate: (fields) => {
      // Not awaited: a change made right after this one must start from it, so the cache changes now.
      void queryClient.cancelQueries({ queryKey })
      queryClient.setQueryData<{ agent: AgentDetail }>(queryKey, {
        agent: applied(cached(), fields),
      })
    },
    onSuccess: ({ agent: saved }) => {
      // While later writes wait, the screen keeps their changes and takes the saved revision.
      const shown =
        queued() > 1 ? { ...saved, draft: cached().draft, tools: cached().tools } : saved
      queryClient.setQueryData<{ agent: AgentDetail }>(queryKey, { agent: shown })
    },
    onSettled: () => (queued() === 1 ? queryClient.invalidateQueries() : undefined),
  })
  const failure = send.error
  return {
    save: (change, saved) =>
      send.mutate(typeof change === 'function' ? change(cached()) : change, { onSuccess: saved }),
    pending: send.isPending,
    error: failure === null ? undefined : writeFailureText(failure, UNCONFIRMED_SAVE),
    refused:
      failure instanceof HubFailure && failure.field !== undefined
        ? { field: failure.field, reason: reasonText(failure.reason) }
        : undefined,
  }
}
