import { phraseOf, ToolCallId } from '@conexus/hub-api'
import { useEffect, useRef, useState } from 'react'
import { ConnectorLogo } from '../../hub/connectors/public.ts'
import { writeFailureText } from '../../platform/hub.ts'
import type { ApprovalOutcome, ApprovalState } from '../../ui/ai/approval.tsx'
import { Approval } from '../../ui/ai/approval.tsx'
import { fieldsOf } from './approval-fields.ts'
import type { ApprovalCardItem, Decision, Outcome, WritesRead } from './approval-item.ts'
import { decided, writtenBy } from './approval-item.ts'
import {
  APPROVAL_TEXT,
  launchedText,
  openWriteText,
  uncertainText,
  wantsText,
} from './approval-text.ts'
import { DEADLINE_TEXT, LOCAL_REFUSALS } from './connector-specs.ts'
import type { WriteTool } from './room.ts'
import { useApprove, useRoom } from './room.ts'
import { refusedLabelText } from './text.ts'
import type { ConnectorWords } from './tool-spec.ts'
import { WaitingOnPhone } from './working-line.tsx'

type Reply = 'approve' | 'decline'

/**
 * Sends the person's answer to the call Mastra keeps waiting on its own route. An answer sent keeps
 * the card busy until the stream says the call ended; one Mastra no longer waits on (`ok: false`:
 * another tab answered, or the Hub restarted) leaves the card to say what the session says.
 */
function useReply(toolCallId: ToolCallId) {
  const approve = useApprove()
  const [sending, setSending] = useState<Reply>()
  const [error, setError] = useState<string>()
  const sent = useRef(false)
  async function reply(which: Reply): Promise<void> {
    if (sent.current) return
    sent.current = true
    setSending(which)
    setError(undefined)
    try {
      const { ok } = await approve(toolCallId, which === 'approve')
      if (ok) return
    } catch (failure) {
      setError(writeFailureText(failure, APPROVAL_TEXT.unsent))
    }
    sent.current = false
    setSending(undefined)
  }
  return { reply, sending, error }
}

/** What a write that ran says under the answer: the order it made, the mark to look for, or why it did not. */
function outcomeView(
  outcome: Outcome,
  of: { connector: string; action: string },
  connectors: ConnectorWords,
): ApprovalOutcome | undefined {
  switch (outcome.kind) {
    case 'LAUNCHED':
      return outcome.code === undefined
        ? undefined
        : { kind: 'NOTE', text: launchedText(outcome.code) }
    case 'UNCERTAIN':
      return { kind: 'NOTE', text: uncertainText(outcome.mark) }
    case 'REFUSED':
      return {
        kind: 'REFUSAL',
        alert: refusedLabelText(connectors.name(of.connector)),
        text: outcome.message ?? undefined,
      }
    case 'FAILED':
      return {
        kind: 'REFUSAL',
        alert: APPROVAL_TEXT.failed,
        text: failureText(outcome, of, connectors),
      }
    default:
      return outcome satisfies never
  }
}

/** Why a write did not go out, said in the words of the connection or of the Hub. */
function failureText(
  failed: Extract<Outcome, { kind: 'FAILED' }>,
  of: { connector: string; action: string },
  words: ConnectorWords,
): string {
  switch (failed.why) {
    case 'UNREACHABLE':
      return words.refusal(of.connector, { kind: 'UNREACHABLE' })
    case 'DEADLINE':
      return DEADLINE_TEXT
    case 'NOT_IN_ROLE':
      return phraseOf('NOT_IN_ROLE', undefined, of.action)
    case 'NOT_GRANTED':
    case 'CALLS_SPENT':
      return LOCAL_REFUSALS[failed.why]
    case 'WRITE_OPEN':
      return APPROVAL_TEXT.writeOpen
    case 'ERROR':
      return APPROVAL_TEXT.errored
    case 'OTHER':
      return failed.text ?? APPROVAL_TEXT.refused
    default:
      return failed.why satisfies never
  }
}

const SENDING = { approve: 'APPROVE', decline: 'DECLINE' } as const

/** The warning of a same write to the same connection that went out and has not come back. */
function openWriteOf(
  read: WritesRead | undefined,
  toolCallId: string,
  write: WriteTool | undefined,
): string | undefined {
  if (read?.kind !== 'READ') return undefined
  const same = read.writes.find(
    (one) =>
      one.toolCallId !== toolCallId &&
      (one.state === 'SENDING' || one.state === 'UNCERTAIN') &&
      one.connectionId === write?.connectionId &&
      one.operation === write?.operation,
  )
  return same === undefined ? undefined : openWriteText(same.sentAt, same.mark)
}

type Ended = Exclude<Decision['state'], 'open'>

/** How the card ended, as the piece shows it: who decided, and what the write did. */
function endedState(
  state: Ended,
  byYou: boolean,
  outcome: ApprovalOutcome | undefined,
): Exclude<ApprovalState, { kind: 'OPEN' }> {
  switch (state) {
    case 'approved':
      return { kind: 'APPROVED', byYou, outcome }
    case 'declined':
      return { kind: 'DECLINED', outcome }
    case 'interrupted':
      return { kind: 'INTERRUPTED', outcome }
    case 'stopped':
      return { kind: 'STOPPED', outcome }
    default:
      return state satisfies never
  }
}

/**
 * The card of a write that asks the person (step 24.5, reference table row "O cartão"), drawn on
 * the plan's: who wants to write what, where, the fields, and **Aprovar** or **Recusar**. The buttons
 * answer only while the session's state holds the call and the read of the open sends has answered,
 * so a person has read the warning, if there is one, before they answer.
 */
export function ApprovalCard({ part }: { part: ApprovalCardItem }) {
  const room = useRoom()
  const { reply, sending, error } = useReply(ToolCallId.parse(part.toolCallId))
  const write = room.writeOf?.(part.toolName)
  const refresh = room.refreshWrites
  const open = part.state === 'open'
  // The record is read again when the card opens and when its call ends: the end is the row's.
  const wasOpen = useRef(open)
  useEffect(() => {
    if (open || wasOpen.current) refresh?.()
    wasOpen.current = open
  }, [open, refresh])
  const system = write === undefined ? '' : room.connectors.name(write.connector)
  const action = write?.label ?? part.toolName
  const title = wantsText(room.agent, action, system)
  const read = room.writes
  const decision = decided(part, writtenBy(read, part.toolCallId), read?.kind === 'READING')
  // Where the room reads the open sends, a person approves only after the read answered.
  const checked = read === undefined || read.kind === 'READ'
  const of = { connector: write?.connector ?? '', action }
  const outcome =
    decision.outcome === undefined ? undefined : outcomeView(decision.outcome, of, room.connectors)
  const logo = write === undefined ? undefined : room.connectors.logoOf(write.connectionId)
  const state: ApprovalState =
    decision.state === 'open'
      ? {
          kind: 'OPEN',
          waiting: <WaitingOnPhone />,
          lit: part.lit && checked,
          sending: sending === undefined ? undefined : SENDING[sending],
          error,
          readFailure:
            read?.kind === 'FAILED' ? { text: read.text, onRetry: () => refresh?.() } : undefined,
          openWrite: openWriteOf(read, part.toolCallId, write),
          locked: undefined,
          onApprove: () => void reply('approve'),
          onDecline: () => void reply('decline'),
        }
      : endedState(decision.state, decision.approved, outcome)
  return (
    <Approval
      title={title}
      connection={write === undefined ? undefined : ` · ${write.connection}`}
      logo={logo === undefined ? undefined : <ConnectorLogo small entry={{ logo }} />}
      fields={fieldsOf(write?.operation, part.args, write?.bound)}
      state={state}
      text={APPROVAL_TEXT}
    />
  )
}
