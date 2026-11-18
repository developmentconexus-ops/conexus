import { ToolCallId } from '@conexus/hub-api'
import type { PlanState, PlanText } from '../../ui/ai/plan.tsx'
import { Plan } from '../../ui/ai/plan.tsx'
import { Markdown } from './markdown.tsx'
import { CARD_TEXT, useAnswer } from './question-card.tsx'
import type { PlanCardItem } from './rows.ts'
import { WaitingOnPhone } from './working-line.tsx'

const PLAN_TEXT: PlanText = {
  readAll: 'Ler plano completo',
  reasonLabel: 'O que mudar no plano',
  approve: 'Aprovar e construir',
  reject: 'Pedir ajustes',
  sending: CARD_TEXT.sending,
  approved: 'Plano aprovado.',
  rejected: 'Este plano foi substituído.',
  closed: 'Este plano foi fechado.',
}

const ENDED = {
  approved: { kind: 'APPROVED' },
  rejected: { kind: 'REJECTED' },
  closed: { kind: 'CLOSED' },
} as const

/**
 * The plan the turn waits on (card of step 14, criterion 34; Mastra playground-ui `plan.tsx:259` at
 * ce7e9c30c1, Conexus OS `plan-pt.tsx:58-70` at e0353c36). The plan as the card showed it goes back
 * with the decision, so the history keeps it (`PlanResume`).
 */
export function PlanCard({ part }: { part: PlanCardItem }) {
  const { answer, sending, error } = useAnswer(ToolCallId.parse(part.toolCallId))
  const shown = { title: part.title, plan: part.plan, path: part.path }
  const state: PlanState =
    part.state === 'open'
      ? {
          kind: 'OPEN',
          waiting: <WaitingOnPhone />,
          busy: sending,
          error,
          onApprove: () => void answer({ action: 'approved', ...shown }),
          onReject: (feedback) => void answer({ action: 'rejected', feedback, ...shown }),
        }
      : ENDED[part.state]
  return (
    <Plan
      title={!part.title ? 'Plano' : `Plano: ${part.title}`}
      body={<Markdown text={part.plan} />}
      state={state}
      text={PLAN_TEXT}
    />
  )
}
