import type { ReactElement, ReactNode } from 'react'
import { Alert } from '../alert.tsx'
import { Button } from '../button.tsx'
import { Card } from '../card.tsx'
import { Notice } from '../notice.tsx'
import { ReadFailure } from '../states.tsx'

export type ApprovalField = { label: string } & (
  | { lines: readonly string[] }
  | { content: ReactNode }
)

/** What the write did, as the piece shows it: a note, or the refusal with its alert. */
export type ApprovalOutcome =
  | { kind: 'NOTE'; text: string }
  | { kind: 'REFUSAL'; alert: string; text: string | undefined }

export type ApprovalState =
  | {
      kind: 'OPEN'
      waiting: ReactNode | undefined
      /** The buttons answer only while the session holds the call and the read of the open writes answered. */
      lit: boolean
      sending: 'APPROVE' | 'WIDER' | 'DECLINE' | undefined
      error: string | undefined
      /** The read of the open writes failed: its sentence and the retry. */
      readFailure: { text: string; onRetry: () => void } | undefined
      /** Another write like this one is still open: the notice's sentence. */
      openWrite: string | undefined
      /** The person may not answer: this sentence takes the place of the two buttons. */
      locked: string | undefined
      onApprove: () => void
      onDecline: () => void
      /**
       * A yes of larger reach beside the yes. Given at all, the answers are scopes of one request:
       * they start the line, the wider one first, and on a phone they stack with the yes on top.
       * `'NOT_OFFERED'` keeps that order for a person who may not give the wider one.
       */
      wider?: { label: string; onClick: () => void } | 'NOT_OFFERED'
    }
  /** `byYou`: the record keeps the person's approval, and the card says so. */
  | { kind: 'APPROVED'; byYou: boolean; outcome: ApprovalOutcome | undefined }
  | { kind: 'DECLINED'; outcome: ApprovalOutcome | undefined }
  | { kind: 'INTERRUPTED'; outcome: ApprovalOutcome | undefined }
  | { kind: 'STOPPED'; outcome: ApprovalOutcome | undefined }

export type ApprovalText = {
  approve: string
  decline: string
  approving: string
  declining: string
  approved: string
  declined: string
  interrupted: string
  stopped: string
  steer: string
}

type Open = Extract<ApprovalState, { kind: 'OPEN' }>
type Ended = Exclude<ApprovalState, Open>

function Fields({ fields }: { fields: readonly ApprovalField[] }) {
  return (
    <dl className="grid grid-cols-[6rem_1fr] gap-x-md gap-y-xs max-md:grid-cols-1">
      {fields.map((field) => (
        <div key={field.label} className="contents max-md:flex max-md:flex-col">
          <dt className="text-text-2">{field.label}</dt>
          <dd className="min-w-0 wrap-anywhere">
            {'content' in field
              ? field.content
              : field.lines.map((line) => (
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

function Outcome({ outcome }: { outcome: ApprovalOutcome }) {
  switch (outcome.kind) {
    case 'NOTE':
      return <p className="text-text-2">{outcome.text}</p>
    case 'REFUSAL':
      return (
        <>
          <Alert tone="danger">{outcome.alert}</Alert>
          {outcome.text !== undefined && (
            <p className="wrap-anywhere text-text-2">{outcome.text}</p>
          )}
        </>
      )
    default:
      return outcome satisfies never
  }
}

function headingOf(state: Ended, text: ApprovalText): string | undefined {
  switch (state.kind) {
    case 'APPROVED':
      return state.byYou ? text.approved : undefined
    case 'DECLINED':
      return text.declined
    case 'INTERRUPTED':
      return text.interrupted
    case 'STOPPED':
      return text.stopped
    default:
      return state satisfies never
  }
}

function Decided({ state, text }: { state: Ended; text: ApprovalText }) {
  const heading = headingOf(state, text)
  return (
    <>
      {heading !== undefined && <p className="font-semibold">{heading}</p>}
      {state.outcome !== undefined && <Outcome outcome={state.outcome} />}
    </>
  )
}

function Answer({ open, text }: { open: Open; text: ApprovalText }) {
  if (open.locked !== undefined) return <p className="text-text-2">{open.locked}</p>
  const off = open.sending !== undefined || !open.lit
  const { wider } = open
  const decline = (
    <Button disabled={off} onClick={open.onDecline}>
      {open.sending === 'DECLINE' ? text.declining : text.decline}
    </Button>
  )
  const approve = (
    <Button
      variant="primary"
      className={wider === undefined ? undefined : 'max-md:order-first'}
      disabled={off}
      onClick={open.onApprove}
    >
      {open.sending === 'APPROVE' ? text.approving : text.approve}
    </Button>
  )
  return (
    <div className="flex flex-col gap-sm">
      {wider === undefined ? (
        <div className="flex flex-wrap justify-end gap-sm">
          {decline}
          {approve}
        </div>
      ) : (
        <div className="flex flex-wrap gap-sm max-md:flex-col">
          {wider !== 'NOT_OFFERED' && (
            <Button disabled={off} onClick={wider.onClick}>
              {open.sending === 'WIDER' ? text.approving : wider.label}
            </Button>
          )}
          {approve}
          {decline}
        </div>
      )}
      {open.error !== undefined && <Alert tone="danger">{open.error}</Alert>}
    </div>
  )
}

/**
 * A write that asks the person, on Mastra's ToolApproval: who wants to write what, where, the
 * fields, and the two answers while open; once decided, who decided and what the write did.
 */
export function Approval(props: {
  title: string
  /** The connection with its separator, after the title; `undefined` when the write is not known. */
  connection: string | undefined
  /** The connection's logo, drawn by the caller. */
  logo: ReactNode | undefined
  fields: readonly ApprovalField[]
  state: ApprovalState
  text: ApprovalText
}): ReactElement {
  const { title, connection, logo, fields, state, text } = props
  return (
    <div className="flex min-w-0 flex-col gap-xs">
      <Card role="region" aria-label={title} className="items-stretch gap-md">
        {state.kind === 'OPEN' && state.waiting}
        <div className="flex items-center gap-sm">
          {logo}
          <h3 className="min-w-0 font-semibold text-text">
            {title}
            {connection !== undefined && <span className="text-text-2">{connection}</span>}
          </h3>
        </div>
        <Fields fields={fields} />
        {state.kind === 'OPEN' && state.readFailure !== undefined && (
          <ReadFailure text={state.readFailure.text} onRetry={state.readFailure.onRetry} />
        )}
        {state.kind === 'OPEN' && state.openWrite !== undefined && (
          <div className="border-l-2 border-warning pl-sm">
            <Notice>{state.openWrite}</Notice>
          </div>
        )}
        {state.kind === 'OPEN' ? (
          <Answer open={state} text={text} />
        ) : (
          <Decided state={state} text={text} />
        )}
      </Card>
      {state.kind === 'OPEN' && state.locked === undefined && (
        <p className="px-xs text-label text-text-2">{text.steer}</p>
      )}
    </div>
  )
}
