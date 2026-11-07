import { ToolCallId } from '@conexus/hub-api'
import { useEffect, useRef, useState } from 'react'
import { ConnectorLogo } from '../../hub/connectors/public.ts'
import { writeFailureText } from '../../platform/hub.ts'
import { Alert } from '../../ui/alert.tsx'
import { Button } from '../../ui/button.tsx'
import { Card } from '../../ui/card.tsx'
import { Notice } from '../../ui/notice.tsx'
import { fieldsOf } from './approval-fields.ts'
import type { ApprovalCardItem, Outcome } from './approval-item.ts'
import {
  APPROVAL_TEXT,
  launchedText,
  openWriteText,
  uncertainText,
  wantsText,
} from './approval-text.ts'
import { DEADLINE_TEXT } from './connector-specs.ts'
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
function Result({ outcome, connector }: { outcome: Outcome; connector: string }) {
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
          <p className="text-text-2">{failureText(outcome, connector, connectors)}</p>
        </>
      )
    default:
      return outcome satisfies never
  }
}

/** Why a write did not go out, said in the words of the connection or of the Hub. */
function failureText(
  failed: Extract<Outcome, { kind: 'FAILED' }>,
  connector: string,
  words: ConnectorWords,
): string {
  switch (failed.why) {
    case 'UNREACHABLE':
      return words.refusal(connector, { kind: 'UNREACHABLE' })
    case 'DEADLINE':
      return DEADLINE_TEXT
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

/**
 * The card of a write that asks the person (step 24.5, reference table row "O cartão"), drawn on
 * the plan's: who wants to write what, where, the fields, and **Aprovar** or **Recusar**. The buttons
 * answer only while the session's state holds the call, so a person has read before they answer.
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
  const same = room.openWrites?.find(
    (one) => one.connectionId === write?.connectionId && one.operation === write?.operation,
  )
  const busy = sending !== undefined
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
        <dl className="grid grid-cols-[6rem_1fr] gap-x-md gap-y-xs max-md:grid-cols-1">
          {fieldsOf(write?.operation, part.args).map((field) => (
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
        {open && same !== undefined && <Notice>{openWriteText(same.sentAt, same.mark)}</Notice>}
        {open ? (
          <div className="flex flex-col gap-sm">
            <div className="flex flex-wrap justify-end gap-sm">
              <Button disabled={busy || !part.lit} onClick={() => void reply('decline')}>
                {sending === 'decline' ? APPROVAL_TEXT.declining : APPROVAL_TEXT.decline}
              </Button>
              <Button
                variant="primary"
                disabled={busy || !part.lit}
                onClick={() => void reply('approve')}
              >
                {sending === 'approve' ? APPROVAL_TEXT.approving : APPROVAL_TEXT.approve}
              </Button>
            </div>
            {error !== undefined && <Alert tone="danger">{error}</Alert>}
          </div>
        ) : (
          <>
            {part.state !== 'open' && <p className="font-semibold">{ANSWERED[part.state]}</p>}
            {part.outcome !== undefined && (
              <Result outcome={part.outcome} connector={write?.connector ?? ''} />
            )}
          </>
        )}
      </Card>
      {open && <p className="px-xs text-label text-text-2">{APPROVAL_TEXT.steer}</p>}
    </div>
  )
}
