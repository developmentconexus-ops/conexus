import { ToolCallId } from '@conexus/hub-api'
import { useId, useLayoutEffect, useRef, useState } from 'react'
import { Button } from '../../ui/button.tsx'
import { Dialog, DialogContent, DialogTrigger } from '../../ui/dialog.tsx'
import { Label } from '../../ui/label.tsx'
import { Textarea } from '../../ui/textarea.tsx'
import { Markdown } from './markdown.tsx'
import type { PlanCardItem } from './parts.ts'
import { CARD_TEXT, useAnswer } from './question-card.tsx'

type Decision = 'approved' | 'rejected'

const STATE_TEXT: Record<string, string> = {
  approved: 'Plano aprovado.',
  rejected: 'Este plano foi substituído.',
  closed: 'Este plano foi fechado.',
}

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

type Answering = {
  sending: boolean
  chosen: Decision | undefined
  error: string | undefined
  reason: string
  asking: boolean
  change: (text: string) => void
  decide: (action: Decision) => void
}

function Reply({ answering }: { answering: Answering }) {
  const field = useId()
  const { sending, chosen } = answering
  function said(action: Decision, words: string) {
    return sending && chosen === action ? CARD_TEXT.sending : words
  }
  return (
    <div className="flex flex-col gap-sm">
      {answering.asking && (
        <div className="flex flex-col gap-xs">
          <Label htmlFor={field}>O que mudar no plano</Label>
          <Textarea
            id={field}
            ref={focusOnce}
            value={answering.reason}
            onChange={(event) => answering.change(event.target.value)}
          />
        </div>
      )}
      <div className="flex flex-wrap gap-sm">
        <Button variant="primary" disabled={sending} onClick={() => answering.decide('approved')}>
          {said('approved', 'Aprovar e construir')}
        </Button>
        <Button disabled={sending} onClick={() => answering.decide('rejected')}>
          {said('rejected', 'Pedir ajustes')}
        </Button>
      </div>
      {answering.error !== undefined && (
        <p role="alert" className="text-danger">
          {answering.error}
        </p>
      )}
    </div>
  )
}

function useDecision(toolCallId: ToolCallId): Answering {
  const { answer, sending, error } = useAnswer(toolCallId)
  const [chosen, setChosen] = useState<Decision>()
  const [reason, change] = useState('')
  const [asking, setAsking] = useState(false)
  function decide(action: Decision) {
    const feedback = reason.trim()
    if (action === 'rejected' && feedback === '') return setAsking(true)
    setChosen(action)
    void answer(
      action === 'approved' ? { kind: 'plan', action } : { kind: 'plan', action, feedback },
    )
  }
  return { sending, chosen, error, reason, asking, change, decide }
}

/**
 * The plan the turn waits on: its text, cut with a fade when it does not fit, and the whole of it in
 * a dialog that holds the same two answers, full screen on a phone (card of step 14, criterion 34;
 * Mastra playground-ui `plan.tsx:259` at ce7e9c30c1, Conexus OS `plan-pt.tsx:58-70` at e0353c36).
 * **Pedir ajustes** first opens the field for the reason, then sends it.
 */
export function PlanCard({ part }: { part: PlanCardItem }) {
  const { ref, clipped } = useClipped()
  const toolCallId = ToolCallId.parse(part.toolCallId)
  const answering = useDecision(toolCallId)
  const title = !part.title ? 'Plano' : `Plano: ${part.title}`
  const plan = part.plan
  const waiting = part.state === 'open'
  return (
    <section
      aria-label={title}
      className="flex min-w-0 flex-col gap-md rounded-card border border-line bg-surface p-md"
    >
      <h3 className="font-semibold text-text">{title}</h3>
      <div
        ref={ref}
        data-slot="plan-text"
        data-clipped={clipped || undefined}
        className="max-h-80 overflow-hidden data-clipped:mask-b-from-60% data-clipped:mask-b-to-100%"
      >
        <Markdown text={plan} />
      </div>
      {clipped && (
        <Dialog>
          <DialogTrigger render={<Button className="self-start" />}>
            Ler plano completo
          </DialogTrigger>
          <DialogContent title={title}>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <Markdown text={plan} />
            </div>
            {waiting && <Reply answering={answering} />}
          </DialogContent>
        </Dialog>
      )}
      {waiting ? (
        <Reply answering={answering} />
      ) : (
        <p className="text-text-2">{STATE_TEXT[part.state]}</p>
      )}
    </section>
  )
}
