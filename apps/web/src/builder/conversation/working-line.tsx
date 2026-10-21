import { ConexusMark } from '../../brand/mark.tsx'
import { useEverySecond } from './elapsed.ts'
import { durationOf, WORKING } from './text.ts'

/**
 * "Builder trabalhando · há 12 s", counted from the instant the server began the turn, so a screen
 * that opens or reconnects mid-turn still says how long it has run. The count is for the eye: the
 * reader hears the line once, not every second.
 */
export function WorkingLine({ startedAt }: { startedAt: string | null }) {
  useEverySecond()
  const seconds =
    startedAt === null ? null : Math.max(0, Math.floor((Date.now() - Date.parse(startedAt)) / 1000))
  return (
    <div role="status" className="flex items-center gap-sm px-md py-sm text-label text-text-2">
      <ConexusMark working size={16} />
      <p>
        {WORKING}
        {seconds !== null && <span aria-hidden="true"> · há {durationOf(seconds)}</span>}
      </p>
    </div>
  )
}
