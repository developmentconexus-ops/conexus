import type { AgentState } from '@conexus/hub-api'
import type { ReactNode } from 'react'
import { ageOf } from '../../platform/dates.ts'
import { Stamp } from '../../ui/block.tsx'
import { titleOf } from '../conversation/text.ts'
import { CHANGED_STATE, DRAFT_STATE, publishedText } from './text.ts'

/**
 * An agent's state as the Pauta's stamps (design V35): the published version in the success colour
 * and, when the draft moved past it, "Rascunho com mudanças" beside it in neutral; never published
 * is a neutral draft.
 */
export function StateStamp({ state }: { state: AgentState }) {
  if (state.kind === 'DRAFT') return <Stamp tone="neutral">{DRAFT_STATE}</Stamp>
  return (
    <>
      <Stamp tone="success">{publishedText(state.version)}</Stamp>
      {state.changed && <Stamp tone="neutral">{CHANGED_STATE}</Stamp>}
    </>
  )
}

/** The inside of a conversation's row: its title, what marks it, and how long ago it moved, at the row's end. */
export function ConversationLine(props: {
  conversation: { title: string | null; createdAt: string; updatedAt: string }
  now: Date
  mark?: ReactNode
}) {
  const { conversation } = props
  return (
    <>
      <span className="min-w-0 flex-1 truncate">{titleOf(conversation)}</span>
      {props.mark}
      <span className="shrink-0 text-fact text-text-2">
        {ageOf(conversation.updatedAt, props.now)}
      </span>
    </>
  )
}
