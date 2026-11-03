import type { AgentDetail, AgentId, CompanyId, DraftPatch, ProjectId } from '@conexus/hub-api'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { HubFailure, writeFailureText } from '../../platform/hub.ts'
import { draftQueue } from './draft-queue.ts'
import { agentQuery, agentsPrefix, sendDraft } from './queries.ts'
import { reasonText, UNCONFIRMED_SAVE } from './text.ts'

export type Saving = {
  /** Writes the fields in the agent's queue; false when the Hub refused them. */
  save: (fields: Omit<DraftPatch, 'revision'>) => Promise<boolean>
  pending: boolean
  /** The refusal to show beside the panel, from the Hub's own words. */
  error: string | undefined
  /** The field a refusal named, and why, for the section that owns it. */
  refused: { field: string | undefined; reason: string | undefined } | undefined
}

/**
 * The writes of the draft of one agent (web W24, criterion 27): a queue per agent, each write with
 * the `revision` the one before returned. Only an `AGENT_DRAFT_STALE` that comes from outside makes
 * the page read the agent again.
 */
export function useDraftSave(
  scope: { companyId: CompanyId; projectId: ProjectId },
  agent: AgentDetail,
): Saving {
  const queryClient = useQueryClient()
  const send = useMutation(sendDraft)
  const agentId: AgentId = agent.id
  const [error, setError] = useState<string>()
  const [refused, setRefused] = useState<Saving['refused']>()
  const latest = useRef({ scope, write: send.mutateAsync })
  const [queue] = useState(() =>
    draftQueue(agent, async (patch) => {
      const { scope: here, write } = latest.current
      const { agent: saved } = await write({ params: { ...here, agentId }, body: patch })
      return saved
    }),
  )
  useEffect(() => {
    latest.current = { scope, write: send.mutateAsync }
    queue.adopt(agent)
  }, [queue, agent, scope, send.mutateAsync])

  async function save(fields: Omit<DraftPatch, 'revision'>) {
    setError(undefined)
    setRefused(undefined)
    try {
      const saved = await queue.save(fields)
      queryClient.setQueryData(agentQuery(scope, agentId).queryKey, { agent: saved })
      void queryClient.invalidateQueries({ queryKey: agentsPrefix(scope) })
      return true
    } catch (failure) {
      if (failure instanceof HubFailure && failure.code === 'AGENT_DRAFT_STALE') {
        await queryClient.invalidateQueries({ queryKey: agentQuery(scope, agentId).queryKey })
      }
      if (failure instanceof HubFailure && failure.field !== undefined) {
        setRefused({ field: failure.field, reason: reasonText(failure.reason) })
      }
      setError(writeFailureText(failure, UNCONFIRMED_SAVE))
      return false
    }
  }
  return { save, pending: send.isPending, error, refused }
}
