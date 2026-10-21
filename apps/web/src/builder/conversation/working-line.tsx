import type { MessagePart } from '@conexus/hub-api'
import { useState } from 'react'
import { ConexusMark } from '../../brand/mark.tsx'
import { useEverySecond } from './elapsed.ts'
import { durationOf, STILL_WORKING, WORKING } from './text.ts'

/** How long the Builder may go without saying anything before the line says it is still at work. */
const QUIET_MS = 60_000

function secondsSince(instant: number): number {
  return Math.max(0, Math.floor((Date.now() - instant) / 1000))
}

/**
 * "Builder trabalhando · há 12 s", counted from the instant the server began the turn, so a screen
 * that opens or reconnects mid-turn still says how long it has run; after a minute in which the
 * answer's parts did not change, "Ainda trabalhando… há 1 min 20 s". The count is for the eye: the
 * reader hears the line once, not every second.
 */
export function WorkingLine({
  startedAt,
  heard,
}: {
  startedAt: string | null
  heard: readonly MessagePart[]
}) {
  useEverySecond()
  const [last, setLast] = useState({ heard, at: Date.now() })
  if (last.heard !== heard) setLast({ heard, at: Date.now() })
  const quiet = Date.now() - last.at >= QUIET_MS
  const seconds = startedAt === null ? null : secondsSince(Date.parse(startedAt))
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
