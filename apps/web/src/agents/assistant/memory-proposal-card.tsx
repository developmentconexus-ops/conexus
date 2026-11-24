import { useRef, useState } from 'react'
import { derivedAttemptKey } from '../../platform/attempt-key.ts'
import { writeFailureText } from '../../platform/hub.ts'
import { Alert } from '../../ui/alert.tsx'
import { Button } from '../../ui/button.tsx'
import {
  MEMORY_PROPOSAL_KIND,
  MEMORY_SAVED,
  ONLY_MANAGERS_MEMORY,
  SAVE,
  SAVING,
  UNCONFIRMED_MEMORY_SAVE,
} from './text.ts'

/**
 * The card of a text the Assistant proposed to save in the company's memory: what kind of save it
 * is, the name it goes under, the text and **Salvar**. It holds no rule of a page: the caller says
 * whether the person may save (`may`, `undefined` while that is read) and how the save goes (`save`,
 * given the attempt key). The key derives from `seed`, so a reload and a second touch save once
 * (code C37, web W24); nothing is saved before the touch. Who may not save reads the text, with no
 * button and the sentence of who may (web W34).
 */
export function MemoryProposalCard(props: {
  kind: keyof typeof MEMORY_PROPOSAL_KIND
  /** The page the text goes to, or the new page's name; none for the instructions. */
  name?: string
  text: string
  may: boolean | undefined
  /** What makes the attempt key: the conversation and the call that proposed. */
  seed: string
  save: (attemptKey: string) => Promise<unknown>
}) {
  const [state, setState] = useState<'IDLE' | 'SAVING' | 'SAVED'>('IDLE')
  const [error, setError] = useState<string>()
  const inFlight = useRef(false)

  async function save() {
    if (inFlight.current) return
    inFlight.current = true
    setError(undefined)
    setState('SAVING')
    try {
      await props.save(await derivedAttemptKey(props.seed))
      setState('SAVED')
    } catch (failure) {
      setError(writeFailureText(failure, UNCONFIRMED_MEMORY_SAVE))
      setState('IDLE')
    } finally {
      inFlight.current = false
    }
  }

  return (
    <div className="flex flex-col items-start gap-sm rounded-card border border-line bg-surface p-md">
      <p className="text-text-2">{MEMORY_PROPOSAL_KIND[props.kind]}</p>
      {props.name !== undefined && <p className="font-display text-title">{props.name}</p>}
      <p className="whitespace-pre-wrap break-words text-text">{props.text}</p>
      {props.may === false && <p className="text-text-2">{ONLY_MANAGERS_MEMORY}</p>}
      {props.may === true &&
        (state === 'SAVED' ? (
          <p role="status" className="text-success">
            {MEMORY_SAVED}
          </p>
        ) : (
          <Button variant="primary" disabled={state === 'SAVING'} onClick={() => void save()}>
            {state === 'SAVING' ? SAVING : SAVE}
          </Button>
        ))}
      {error !== undefined && <Alert tone="danger">{error}</Alert>}
    </div>
  )
}
