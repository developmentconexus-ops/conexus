import type { LucideIcon } from 'lucide-react'
import { CheckIcon, CircleAlertIcon } from 'lucide-react'
import type { ReactElement, ReactNode } from 'react'
import { useState } from 'react'
import {
  TraceCollapsible,
  TraceCollapsibleContent,
  TraceCollapsibleTrigger,
  TraceDescription,
  TraceIcon,
  TraceLine,
  TraceTitle,
} from '../trace.tsx'

export type ToolGroupState =
  | { kind: 'WORKING'; icon: LucideIcon; sentence: string; progress: string }
  | {
      kind: 'DONE'
      failed: boolean
      /** The summary under the container's `@2xl` width, and the whole one above it. */
      short: string
      full: string
      icons: readonly LucideIcon[]
      tally: string
    }

/**
 * Several tool lines as one, on Mastra's tool group (`ToolCallGroup`): while the turn works it
 * names the call in progress and the count, once done what the calls did. Closed until the person opens it.
 */
export function ToolGroup(props: { state: ToolGroupState; children: ReactNode }): ReactElement {
  const { state, children } = props
  const [chosen, setChosen] = useState<boolean>()
  const status = state.kind === 'WORKING' ? 'running' : state.failed ? 'error' : undefined
  return (
    <TraceCollapsible open={chosen ?? false} onOpenChange={setChosen} className="@container">
      <TraceCollapsibleTrigger>
        <TraceLine status={status}>
          {state.kind === 'WORKING' ? (
            <>
              <TraceIcon>
                <state.icon />
              </TraceIcon>
              <TraceTitle>{state.sentence}</TraceTitle>
              <TraceDescription>{state.progress}</TraceDescription>
            </>
          ) : (
            <>
              <TraceIcon>{state.failed ? <CircleAlertIcon /> : <CheckIcon />}</TraceIcon>
              <TraceTitle>
                <span className="@2xl:hidden">{state.short}</span>
                <span className="hidden @2xl:inline">{state.full}</span>
              </TraceTitle>
              <span aria-hidden="true" className="flex shrink-0 items-center gap-xs text-text-2">
                {state.icons.map((Icon) => (
                  <Icon key={Icon.displayName ?? Icon.name} className="size-3.5" />
                ))}
              </span>
              <TraceDescription className="shrink-0">{state.tally}</TraceDescription>
            </>
          )}
        </TraceLine>
      </TraceCollapsibleTrigger>
      <TraceCollapsibleContent className="flex flex-col gap-sm">{children}</TraceCollapsibleContent>
    </TraceCollapsible>
  )
}
