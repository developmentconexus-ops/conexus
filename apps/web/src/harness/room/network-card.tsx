import type { NetworkAnswer, NetworkAsked } from '@conexus/hub-api'
import { ToolCallId } from '@conexus/hub-api'
import { useQuery } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { companyQuery } from '../../hub/identity/public.ts'
import type { ApprovalField, ApprovalState, ApprovalText } from '../../ui/ai/approval.tsx'
import { Approval } from '../../ui/ai/approval.tsx'
import { APPROVAL_TEXT, NETWORK_TEXT } from './approval-text.ts'
import type { NetworkCardItem } from './network-parse.ts'
import { useAnswer } from './question-card.tsx'
import { useRoom } from './room.ts'
import { WaitingOnPhone } from './working-line.tsx'

type OpenItem = Extract<NetworkCardItem, { state: 'open' }>
type Tapped = 'APPROVE' | 'WIDER' | 'DECLINE'

function Fact({ children }: { children: ReactNode }) {
  return <span className="font-mono text-fact">{children}</span>
}

function Domain({ domain }: { domain: string }) {
  if (!domain.startsWith('*.')) return <Fact>{domain}</Fact>
  const base = domain.slice(2)
  return (
    <>
      {NETWORK_TEXT.endingIn}
      <Fact>.{base}</Fact>
      {NETWORK_TEXT.butNot}
      <Fact>{base}</Fact>
    </>
  )
}

function fieldsOf(asked: NetworkAsked | undefined): ApprovalField[] {
  if (asked === undefined) return []
  const domains = [...new Set(asked.domains)].map((domain) => (
    <span key={domain} className="block">
      <Domain domain={domain} />
    </span>
  ))
  return [
    { label: NETWORK_TEXT.domains, content: domains },
    { label: NETWORK_TEXT.reason, lines: [asked.reason] },
  ]
}

const TEXT: ApprovalText = {
  ...APPROVAL_TEXT,
  approve: NETWORK_TEXT.conversation,
  approving: NETWORK_TEXT.releasing,
  approved: NETWORK_TEXT.openedConversation,
  declined: NETWORK_TEXT.refused,
  steer: NETWORK_TEXT.steer,
}

function Drawn(props: {
  asked: NetworkAsked | undefined
  state: ApprovalState
  text: ApprovalText
}) {
  return (
    <Approval
      title={NETWORK_TEXT.title}
      connection={undefined}
      logo={undefined}
      fields={fieldsOf(props.asked)}
      state={props.state}
      text={props.text}
    />
  )
}

function OpenCard({ part }: { part: OpenItem }) {
  const { network } = useRoom()
  const company = useQuery(companyQuery(network.companyId))
  const { answer, sending, error } = useAnswer(ToolCallId.parse(part.toolCallId))
  const [tapped, setTapped] = useState<Tapped>('APPROVE')
  function reply(button: Tapped, scope: NetworkAnswer['scope']) {
    setTapped(button)
    void answer({ scope })
  }
  const may = company.data?.may
  const here =
    part.scopes.includes('CONVERSATION') && (may === undefined || may.openConversationNetwork)
  const wide = part.scopes.includes('COMPANY') && (may === undefined || may.manageNetwork)
  const yes = here ? 'CONVERSATION' : 'COMPANY'
  const locked = !here && !wide
  const state: ApprovalState = {
    kind: 'OPEN',
    waiting: locked ? undefined : <WaitingOnPhone />,
    lit: !company.isPending,
    sending: sending ? tapped : undefined,
    error,
    readFailure: undefined,
    openWrite: undefined,
    locked: locked ? NETWORK_TEXT.notOpen.ROLE : undefined,
    onApprove: () => reply('APPROVE', yes),
    onDecline: () => reply('DECLINE', 'REFUSED'),
    wider:
      here && wide
        ? { label: NETWORK_TEXT.company, onClick: () => reply('WIDER', 'COMPANY') }
        : 'NOT_OFFERED',
  }
  const text = yes === 'CONVERSATION' ? TEXT : { ...TEXT, approve: NETWORK_TEXT.company }
  return <Drawn asked={part.asked} state={state} text={text} />
}

function endedState(part: Exclude<NetworkCardItem, OpenItem>): ApprovalState {
  switch (part.state) {
    case 'conversation':
    case 'company':
      return { kind: 'APPROVED', byYou: true, outcome: undefined }
    case 'refused':
      return { kind: 'DECLINED', outcome: undefined }
    case 'not-open':
      return {
        kind: 'APPROVED',
        byYou: false,
        outcome: { kind: 'NOTE', text: NETWORK_TEXT.notOpen[part.reason] },
      }
    default:
      return part satisfies never
  }
}

export function NetworkAccessCard({ part }: { part: NetworkCardItem }) {
  if (part.state === 'open') return <OpenCard part={part} />
  const text = part.state === 'company' ? { ...TEXT, approved: NETWORK_TEXT.openedCompany } : TEXT
  return <Drawn asked={part.asked} state={endedState(part)} text={text} />
}
