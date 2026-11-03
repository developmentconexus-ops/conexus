import type { AgentDetail, CompanyId, ConversationId, ProjectId } from '@conexus/hub-api'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { ageOf } from '../../platform/dates.ts'
import { BlockSentence } from '../../ui/block.tsx'
import { Button } from '../../ui/button.tsx'
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '../../ui/combobox.tsx'
import type { useOpenAgentConversation } from './open-conversation.ts'
import { agentConversationsQuery } from './queries.ts'
import { ReadStates } from './read-states.tsx'
import { NO_AGENT_CONVERSATIONS, titleOf } from './text.ts'

type Scope = { companyId: CompanyId; projectId: ProjectId }
type Item = { value: ConversationId; label: string }

/**
 * The test panel of the agent's page (step 24.3, U5, criterion 27), beside the configuration: a
 * switch between the person's conversations with the agent, **Nova conversa** and **Testar
 * rascunho**, and under them the conversation the address opens (`children`, the route's outlet).
 */
export function TestPanel(props: {
  scope: Scope
  agent: AgentDetail
  conversationId: ConversationId | undefined
  opener: ReturnType<typeof useOpenAgentConversation>
  children: ReactNode
}) {
  const { scope, agent, opener } = props
  const read = useQuery(agentConversationsQuery(scope, agent.id))
  const navigate = useNavigate()
  const now = new Date()
  const items: Item[] = (read.data?.conversations ?? []).map((one) => ({
    value: one.id,
    label: `${titleOf(one)}${one.draft ? ' · Teste' : ''} · ${ageOf(one.updatedAt, now)}`,
  }))
  const current = items.find((one) => one.value === props.conversationId)
  return (
    <section aria-label="Testar" className="flex h-full min-h-0 flex-col bg-surface">
      <div className="flex flex-col gap-xs border-b border-line p-sm">
        <Combobox
          items={items}
          value={current ?? null}
          isItemEqualToValue={(a, b) => a.value === b.value}
          onValueChange={(item) =>
            item !== null &&
            void navigate({
              to: '/companies/$companyId/projects/$projectId/agents/$agentId/$conversationId',
              params: { ...scope, agentId: agent.id, conversationId: item.value },
            })
          }
        >
          <ComboboxInput aria-label="Conversas" placeholder="Conversas" />
          <ComboboxContent>
            <ComboboxEmpty>Nenhuma conversa</ComboboxEmpty>
            <ComboboxList>
              {(item: Item) => (
                <ComboboxItem key={item.value} value={item}>
                  {item.label}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
        <ReadStates read={read} />
        <div className="flex flex-wrap gap-sm">
          {agent.state.kind === 'PUBLISHED' && (
            <Button size="sm" disabled={opener.pending} onClick={() => void opener.open(false)}>
              Nova conversa
            </Button>
          )}
          <Button size="sm" disabled={opener.pending} onClick={() => void opener.open(true)}>
            Testar rascunho
          </Button>
        </div>
        {opener.error !== undefined && (
          <p role="alert" className="text-danger">
            {opener.error}
          </p>
        )}
      </div>
      <div className="min-h-0 flex-1">
        {props.conversationId !== undefined
          ? props.children
          : read.data?.conversations.length === 0 && (
              <BlockSentence>{NO_AGENT_CONVERSATIONS}</BlockSentence>
            )}
      </div>
    </section>
  )
}
