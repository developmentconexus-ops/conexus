import type { ReactElement, ReactNode } from 'react'
import { useId, useLayoutEffect, useRef, useState } from 'react'
import { Alert } from '../alert.tsx'
import { Button } from '../button.tsx'
import { Card } from '../card.tsx'
import { Dialog, DialogContent, DialogTrigger } from '../dialog.tsx'
import { Label } from '../label.tsx'
import { Textarea } from '../textarea.tsx'

export type PlanState =
  /** The piece keeps the reason's field and which button was pressed; the caller says whether it sends and the error. */
  | {
      kind: 'OPEN'
      waiting: ReactNode | undefined
      busy: boolean
      error: string | undefined
      onApprove: () => void
      onReject: (reason: string) => void
    }
  | { kind: 'APPROVED' }
  | { kind: 'REJECTED' }
  | { kind: 'CLOSED' }

export type PlanText = {
  readAll: string
  reasonLabel: string
  approve: string
  reject: string
  sending: string
  approved: string
  rejected: string
  closed: string
}

type Open = Extract<PlanState, { kind: 'OPEN' }>
type Choice = 'APPROVE' | 'REJECT'

function useClipped() {
  const ref = useRef<HTMLDivElement>(null)
  const [clipped, setClipped] = useState(false)
  useLayoutEffect(() => {
    const element = ref.current
    if (element === null) return
    const box: HTMLElement = element
    function measure() {
      setClipped(box.scrollHeight > box.clientHeight)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    if (element.firstElementChild !== null) observer.observe(element.firstElementChild)
    return () => observer.disconnect()
  }, [])
  return { ref, clipped }
}

function focusOnce(element: HTMLTextAreaElement | null) {
  element?.focus()
}

/** The draft both answers share, the card's and the dialog's, as Mastra's AskUser keeps its draft. */
function useDraft(state: PlanState) {
  const [chosen, setChosen] = useState<Choice>()
  const [reason, change] = useState('')
  const [asking, setAsking] = useState(false)
  function decide(choice: Choice) {
    if (state.kind !== 'OPEN') return
    const feedback = reason.trim()
    if (choice === 'REJECT' && feedback === '') return setAsking(true)
    setChosen(choice)
    if (choice === 'APPROVE') state.onApprove()
    else state.onReject(feedback)
  }
  return { chosen, reason, asking, change, decide }
}

type Draft = ReturnType<typeof useDraft>

function Reply(props: { open: Open; draft: Draft; text: PlanText }) {
  const { open, draft, text } = props
  const field = useId()
  function said(choice: Choice, words: string) {
    return open.busy && draft.chosen === choice ? text.sending : words
  }
  return (
    <div className="flex flex-col gap-sm">
      {draft.asking && (
        <div className="flex flex-col gap-xs">
          <Label htmlFor={field}>{text.reasonLabel}</Label>
          <Textarea
            id={field}
            ref={focusOnce}
            value={draft.reason}
            onChange={(event) => draft.change(event.target.value)}
          />
        </div>
      )}
      <div className="flex flex-wrap gap-sm">
        <Button variant="primary" disabled={open.busy} onClick={() => draft.decide('APPROVE')}>
          {said('APPROVE', text.approve)}
        </Button>
        <Button disabled={open.busy} onClick={() => draft.decide('REJECT')}>
          {said('REJECT', text.reject)}
        </Button>
      </div>
      {open.error !== undefined && <Alert tone="danger">{open.error}</Alert>}
    </div>
  )
}

const ENDED = { APPROVED: 'approved', REJECTED: 'rejected', CLOSED: 'closed' } as const

/**
 * The plan the turn waits on, on Mastra's Plan: its text, cut with a fade when it does not fit,
 * and the whole of it in a dialog that holds the same two answers, full screen on a phone. The
 * reject answer first opens the field for the reason, then sends it.
 */
export function Plan(props: {
  title: string
  body: ReactNode
  state: PlanState
  text: PlanText
}): ReactElement {
  const { title, body, state, text } = props
  const { ref, clipped } = useClipped()
  const draft = useDraft(state)
  return (
    <Card role="region" aria-label={title} className="items-stretch gap-md">
      {state.kind === 'OPEN' && state.waiting}
      <h3 className="font-semibold text-text">{title}</h3>
      <div
        ref={ref}
        data-slot="plan-text"
        data-clipped={clipped || undefined}
        className="max-h-80 overflow-hidden data-clipped:mask-b-from-60% data-clipped:mask-b-to-100%"
      >
        {body}
      </div>
      {clipped && (
        <Dialog>
          <DialogTrigger render={<Button className="self-start" />}>{text.readAll}</DialogTrigger>
          <DialogContent title={title} size="page">
            <div className="min-h-0 flex-1 overflow-y-auto">{body}</div>
            {state.kind === 'OPEN' && <Reply open={state} draft={draft} text={text} />}
          </DialogContent>
        </Dialog>
      )}
      {state.kind === 'OPEN' ? (
        <Reply open={state} draft={draft} text={text} />
      ) : (
        <p className="text-text-2">{text[ENDED[state.kind]]}</p>
      )}
    </Card>
  )
}
