import { phraseOf, ToolCallId } from '@conexus/hub-api'
import { useEffect, useRef, useState } from 'react'
import { ConnectorLogo } from '../../hub/connectors/public.ts'
import { writeFailureText } from '../../platform/hub.ts'
import { Alert } from '../../ui/alert.tsx'
import { Button } from '../../ui/button.tsx'
import { Card } from '../../ui/card.tsx'
import { Notice } from '../../ui/notice.tsx'
import { ReadFailure } from '../../ui/states.tsx'
import { fieldsOf } from './approval-fields.ts'
import type { ApprovalCardItem, Outcome } from './approval-item.ts'
import {
  APPROVAL_TEXT,
  launchedText,
  openWriteText,
  uncertainText,
  wantsText,
} from './approval-text.ts'
import { DEADLINE_TEXT, LOCAL_REFUSALS } from './connector-specs.ts'
import { WaitingCaption } from './question-card.tsx'
import { useApprove, useRoom } from './room.ts'
import type { ConnectorWords } from './tool-spec.ts'

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
function Result(props: { outcome: Outcome; connector: string; action: string }) {
  const { outcome, connector, action } = props
  const { connectors } = useRoom()
  switch (outcome.kind) {
    case 'LAUNCHED':
      return outcome.code === undefined ? null : (
        <p className="text-text-2">{launchedText(outcome.code)}</p>
      )
    case 'UNCERTAIN':
      return <p className="text-text-2">{uncertainText(outcome.mark)}</p>
    case 'FAILED':
      return (
        <>
          <Alert tone="danger">{APPROVAL_TEXT.failed}</Alert>
          <p className="text-text-2">{failureText(outcome, { connector, action }, connectors)}</p>
        </>
      )
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

function ConnectionLogo({ connectionId }: { connectionId: string | undefined }) {
  const { connectors } = useRoom()
  const logo = connectionId === undefined ? undefined : connectors.logoOf(connectionId)
  return logo === undefined ? null : <ConnectorLogo small entry={{ logo }} />
}

const ANSWERED = {
  approved: APPROVAL_TEXT.approved,
  declined: APPROVAL_TEXT.declined,
  interrupted: APPROVAL_TEXT.interrupted,
  stopped: APPROVAL_TEXT.stopped,
} as const

type Fields = ReturnType<typeof fieldsOf>

function Fields({ fields }: { fields: Fields }) {
  return (
    <dl className="grid grid-cols-[6rem_1fr] gap-x-md gap-y-xs max-md:grid-cols-1">
      {fields.map((field) => (
        <div key={field.label} className="contents max-md:flex max-md:flex-col">
          <dt className="text-text-2">{field.label}</dt>
          <dd className="min-w-0 wrap-anywhere">
            {field.lines.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </dd>
        </div>
      ))}
    </dl>
  )
}

/** How the card ended: who decided, and what the write did. */
function Decided(props: { part: ApprovalCardItem; connector: string; action: string }) {
  const { part, connector, action } = props
  return (
    <>
      {part.state !== 'open' && <p className="font-semibold">{ANSWERED[part.state]}</p>}
      {part.outcome !== undefined && (
        <Result outcome={part.outcome} connector={connector} action={action} />
      )}
    </>
  )
}

type Replying = ReturnType<typeof useReply>

/** Recusar and Aprovar, lit only while the session's state holds the call. */
function Answer(props: { lit: boolean } & Pick<Replying, 'sending' | 'error' | 'reply'>) {
  const { lit, sending, error, reply } = props
  const off = sending !== undefined || !lit
  return (
    <div className="flex flex-col gap-sm">
      <div className="flex flex-wrap justify-end gap-sm">
        <Button disabled={off} onClick={() => void reply('decline')}>
          {sending === 'decline' ? APPROVAL_TEXT.declining : APPROVAL_TEXT.decline}
        </Button>
        <Button variant="primary" disabled={off} onClick={() => void reply('approve')}>
          {sending === 'approve' ? APPROVAL_TEXT.approving : APPROVAL_TEXT.approve}
        </Button>
      </div>
      {error !== undefined && <Alert tone="danger">{error}</Alert>}
    </div>
  )
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
  const refresh = room.refreshOpenWrites
  const open = part.state === 'open'
  useEffect(() => {
    if (open) refresh?.()
  }, [open, refresh])
  const system = write === undefined ? '' : room.connectors.name(write.connector)
  const action = write?.label ?? part.toolName
  const title = wantsText(room.agent, action, system)
  const read = room.openWrites
  const same =
    read?.kind === 'READ'
      ? read.writes.find(
          (one) => one.connectionId === write?.connectionId && one.operation === write?.operation,
        )
      : undefined
  // Where the room reads the open sends, a person approves only after the read answered.
  const checked = read === undefined || read.kind === 'READ'
  return (
    <div className="flex min-w-0 flex-col gap-xs">
      <Card role="region" aria-label={title} className="items-stretch gap-md">
        {open && <WaitingCaption />}
        <div className="flex items-center gap-sm">
          <ConnectionLogo connectionId={write?.connectionId} />
          <h3 className="min-w-0 font-semibold text-text">
            {title}
            {write !== undefined && <span className="text-text-2"> · {write.connection}</span>}
          </h3>
        </div>
        <Fields fields={fieldsOf(write?.operation, part.args)} />
        {open && read?.kind === 'FAILED' && (
          <ReadFailure text={read.text} onRetry={() => refresh?.()} />
        )}
        {open && same !== undefined && <Notice>{openWriteText(same.sentAt, same.mark)}</Notice>}
        {open ? (
          <Answer lit={part.lit && checked} sending={sending} error={error} reply={reply} />
        ) : (
          <Decided part={part} connector={write?.connector ?? ''} action={action} />
        )}
      </Card>
      {open && <p className="px-xs text-label text-text-2">{APPROVAL_TEXT.steer}</p>}
    </div>
  )
}
