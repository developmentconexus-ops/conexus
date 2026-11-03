import type { AgentState } from '@conexus/hub-api'
import type { ReactNode } from 'react'
import { ageOf } from '../../platform/dates.ts'
import { Stamp } from '../../ui/block.tsx'
import { stateText, titleOf } from './text.ts'

/** An agent's state as the Pauta's stamp: published in the success colour, a draft or a draft with changes in neutral (design V35). */
export function StateStamp({ state }: { state: AgentState }) {
  const live = state.kind === 'PUBLISHED' && !state.changed
  return <Stamp tone={live ? 'success' : 'neutral'}>{stateText(state)}</Stamp>
}

/** The inside of a conversation's row: its title, what marks it, and how long ago it moved, at the row's end. */
export function ConversationLine(props: {
  conversation: { title: string; updatedAt: string }
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
