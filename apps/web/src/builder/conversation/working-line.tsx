import { useState } from 'react'
import { WorkingLine as Line } from '../../ui/ai/working-line.tsx'
import { useIsMobile } from '../../ui/use-mobile.ts'
import { useEverySecond } from './elapsed.ts'
import { useRoom } from './room.ts'
import { durationOf, STILL_WORKING, workingText } from './text.ts'

/** The line while a question, a plan or an approval waits on the person (founder, 2026-10-22, "Aprovo"). */
function waitingText(agent: string): string {
  return `${agent} esperando sua resposta.`
}

/** How long the Builder may go without saying anything before the line says it is still at work. */
const QUIET_MS = 60_000

function secondsSince(instant: number): number {
  return Math.max(0, Math.floor((Date.now() - instant) / 1000))
}

/**
 * "Builder trabalhando · há 12 s", counted from the instant the screen heard the run start (a screen
 * that opens mid-run shows no count, as Mastra's display state has no start); after a minute in which the
 * answer's parts did not change, "Ainda trabalhando… há 1 min 20 s". While a question, a plan or an
 * approval waits on the person, the line says so, with no clock: the time is hers.
 */
export function WorkingLine({
  startedAt,
  heard,
  waiting,
}: {
  startedAt: number | null
  heard: unknown
  waiting: boolean
}) {
  useEverySecond()
  const { agent } = useRoom()
  const [last, setLast] = useState({ heard, at: Date.now() })
  if (last.heard !== heard) setLast({ heard, at: Date.now() })
  const quiet = Date.now() - last.at >= QUIET_MS
  const seconds = startedAt === null ? null : secondsSince(startedAt)
  return (
    <div className="px-md py-sm">
      <Line
        state={
          waiting
            ? { kind: 'WAITING', sentence: waitingText(agent) }
            : {
                kind: 'WORKING',
                sentence: quiet ? STILL_WORKING : workingText(agent),
                since:
                  seconds === null ? undefined : `${quiet ? ' ' : ' · '}há ${durationOf(seconds)}`,
              }
        }
      />
    </div>
  )
}

/**
 * On a phone the open card says the conversation's agent waits on the person, in place of the
 * working line, which the chat hides then (founder, 2026-10-22, "Aprovo"; one line for both screens,
 * founder, 2026-11-17, "Aprovo").
 */
/** The waiting line at the top of an open card on a phone; its own component, so the phone check re-renders only it, not the card. */
export function WaitingOnPhone() {
  const { agent } = useRoom()
  if (!useIsMobile()) return null
  return <Line state={{ kind: 'WAITING', sentence: `${agent} esperando sua resposta` }} />
}
