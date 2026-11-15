import type {
  AssistantConversation,
  CompanyId,
  CompanyMemoryPageId,
  ProposedCompanyMemory,
} from '@conexus/hub-api'
import { useMutation, useQuery } from '@tanstack/react-query'
import { sentenceOf } from '../../platform/hub.ts'
import { ReadFailure } from '../../ui/states.tsx'
import { MemoryProposalCard } from './memory-proposal-card.tsx'
import {
  companyMemoryQuery,
  sendCompanyMemoryNoteAddition,
  sendCompanyMemoryPageCreation,
} from './queries.ts'

/**
 * `propose_company_memory`'s card in the Assistant's conversation (U9): a new page or a note, saved
 * by the Memória da empresa routes, so the author is the person who touched. Whether the person may
 * save is the Hub's answer on the company's memory.
 */
export function CompanyMemoryProposal(props: {
  companyId: CompanyId
  conversation: Pick<AssistantConversation, 'id'>
  proposed: ProposedCompanyMemory
  toolCallId: string
}) {
  const { companyId, proposed } = props
  const memory = useQuery(companyMemoryQuery(companyId))
  const page = useMutation(sendCompanyMemoryPageCreation)
  const note = useMutation(sendCompanyMemoryNoteAddition)
  if (memory.isError)
    return <ReadFailure text={sentenceOf(memory.error)} onRetry={() => void memory.refetch()} />

  function save(attemptKey: string) {
    if (proposed.kind === 'PAGE')
      return page.mutateAsync({
        params: { companyId },
        body: { name: proposed.name, body: proposed.body },
        attemptKey,
      })
    const pageId: CompanyMemoryPageId = proposed.pageId
    return note.mutateAsync({
      params: { companyId, pageId },
      body: { body: proposed.body },
      attemptKey,
    })
  }

  return (
    <MemoryProposalCard
      kind={proposed.kind}
      name={proposed.kind === 'PAGE' ? proposed.name : proposed.pageName}
      text={proposed.body}
      may={memory.data?.mayManage}
      seed={`${props.conversation.id}:${props.toolCallId}`}
      save={save}
    />
  )
}
