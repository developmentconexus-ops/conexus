import type { MessagePart } from '@conexus/hub-api'
import { BrainIcon } from 'lucide-react'
import { TraceIcon, TraceLine, TraceTitle } from '../../ui/trace.tsx'
import { thoughtOf } from './tool-text.ts'

type Thought = Extract<MessagePart, { type: 'reasoning' }>

/** The thinking: its text never leaves the server, so the line has nothing to open (design V39). */
export function ThinkingLine({ part }: { part: Thought }) {
  return (
    <TraceLine status={part.state === 'running' ? 'running' : undefined}>
      <TraceIcon>
        <BrainIcon />
      </TraceIcon>
      <TraceTitle>{thoughtOf(part)}</TraceTitle>
    </TraceLine>
  )
}
