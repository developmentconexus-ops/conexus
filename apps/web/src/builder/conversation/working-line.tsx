import { useState } from 'react'
import { ConexusMark } from '../../brand/mark.tsx'
import { useEverySecond } from './elapsed.ts'
import { durationOf, STILL_WORKING, WORKING } from './text.ts'

/** The line while a question or a plan waits on the person (founder, 2026-10-22, "Aprovo"). */
const WAITING = 'Builder esperando sua resposta.'

/** How long the Builder may go without saying anything before the line says it is still at work. */
const QUIET_MS = 60_000

function secondsSince(instant: number): number {
  return Math.max(0, Math.floor((Date.now() - instant) / 1000))
}

/**
 * "Builder trabalhando · há 12 s", counted from the instant the screen heard the run start (a screen
 * that opens mid-run shows no count, as Mastra's display state has no start); after a minute in which the
 * answer's parts did not change, "Ainda trabalhando… há 1 min 20 s". The count is for the eye: the
 * reader hears the line once, not every second. While a question or a plan waits on the person,
 * the line says so, with no clock: the time is hers.
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
  const [last, setLast] = useState({ heard, at: Date.now() })
  if (last.heard !== heard) setLast({ heard, at: Date.now() })
  const quiet = Date.now() - last.at >= QUIET_MS
  const seconds = startedAt === null ? null : secondsSince(startedAt)
  if (waiting) {
    return (
      <div role="status" className="flex items-center gap-sm px-md py-sm text-label text-text-2">
        <ConexusMark size={16} />
        <p>{WAITING}</p>
      </div>
    )
  }
  return (
    <div role="status" className="flex items-center gap-sm px-md py-sm text-label text-text-2">
      <ConexusMark working size={16} />
      <p>
        {quiet ? STILL_WORKING : WORKING}
        {seconds !== null && (
          <span aria-hidden="true">
            {quiet ? ' ' : ' · '}há {durationOf(seconds)}
          </span>
        )}
      </p>
    </div>
  )
}
