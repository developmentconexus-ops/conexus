import type { CompanyId } from '@conexus/hub-api'
import { ToolCallId } from '@conexus/hub-api'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { connectionsQuery } from '../../hub/connectors/public.ts'
import type { ApprovalState } from '../../ui/ai/approval.tsx'
import { Approval } from '../../ui/ai/approval.tsx'
import { APPROVAL_TEXT, NOTE_TEXT } from './approval-text.ts'
import type { NoteAsked, NoteCardItem } from './note-parse.ts'
import { useAnswer } from './question-card.tsx'
import { useRoom } from './room.ts'

function fieldsOf(asked: NoteAsked | undefined) {
  if (asked === undefined) return []
  return [
    { label: NOTE_TEXT.concept, lines: [asked.concept] },
    { label: NOTE_TEXT.mapping, lines: [asked.mapping] },
    { label: NOTE_TEXT.query, lines: [asked.provingQuery] },
  ]
}

/** How the card ended: the notebook took the concept, the person said no, or the Hub refused the yes, which only who manages connections may give. */
function endedState(state: Exclude<NoteCardItem['state'], 'open'>, may: boolean) {
  switch (state) {
    case 'saved':
      return { kind: 'APPROVED', byYou: true, outcome: undefined } as const
    case 'declined':
      return { kind: 'DECLINED', outcome: undefined } as const
    case 'refused':
      return {
        kind: 'APPROVED',
        byYou: false,
        outcome: { kind: 'REFUSAL', alert: may ? NOTE_TEXT.gone : NOTE_TEXT.ask, text: undefined },
      } as const
    default:
      return state satisfies never
  }
}

/**
 * The card of the notebook's save (U19): "Gravar no Caderno?" with the concept, the mapping and the
 * query that proves it, on the write's card. The call suspends, as `ask_user` does, and the yes or
 * no resumes it. Whoever may not manage connections sees the card without the buttons, and the
 * sentence that sends them to who does; the Hub refuses their yes anyway.
 */
function NoteCard({ part, may }: { part: NoteCardItem; may: boolean | undefined }) {
  const { answer, sending, error } = useAnswer(ToolCallId.parse(part.toolCallId))
  const [said, setSaid] = useState<'APPROVE' | 'DECLINE'>('APPROVE')
  function reply(approved: boolean) {
    setSaid(approved ? 'APPROVE' : 'DECLINE')
    void answer({ approved })
  }
  const state: ApprovalState =
    part.state === 'open'
      ? {
          kind: 'OPEN',
          waiting: undefined,
          lit: may !== undefined,
          sending: sending ? said : undefined,
          error,
          readFailure: undefined,
          openWrite: undefined,
          locked: may === false ? NOTE_TEXT.ask : undefined,
          onApprove: () => reply(true),
          onDecline: () => reply(false),
        }
      : endedState(part.state, may === true)
  return (
    <Approval
      title={NOTE_TEXT.title}
      connection={part.asked === undefined ? undefined : ` · ${part.asked.connection}`}
      logo={undefined}
      fields={fieldsOf(part.asked)}
      state={state}
      text={{ ...APPROVAL_TEXT, declined: NOTE_TEXT.declined }}
    />
  )
}

/** Whether the person manages the company's connections, as the Hub answers on the list; unknown while it is read, and asked of the Hub alone when the read fails. */
function NoteOfCompany({ part, companyId }: { part: NoteCardItem; companyId: CompanyId }) {
  const connections = useQuery(connectionsQuery(companyId))
  const may = connections.isSuccess
    ? connections.data.mayManage
    : connections.isError
      ? true
      : undefined
  return <NoteCard part={part} may={may} />
}

export function NoteSaveCard({ part }: { part: NoteCardItem }) {
  const { notebook } = useRoom()
  if (notebook === undefined) return <NoteCard part={part} may />
  return <NoteOfCompany part={part} companyId={notebook.companyId} />
}
