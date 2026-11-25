import type { LakeRun } from '@conexus/hub-api'
import { clockOf, dayAndMonth } from '../../platform/dates.ts'
import { Badge } from '../../ui/badge.tsx'
import { RUNNING, UP_TO_DATE, WITH_ERROR } from '../connectors/public.ts'
import { INTERRUPTED, NO_VALUE } from './text.ts'

/** How a round stands, in a word with its dot: running, up to date, with an error, interrupted. */
export function RunBadge({ run }: { run: LakeRun | null }) {
  if (run === null) return null
  switch (run.outcome) {
    case 'RUNNING':
      return <Badge>{RUNNING}</Badge>
    case 'COMPLETE':
      return <Badge tone="success">{UP_TO_DATE}</Badge>
    case 'ERROR':
      return <Badge tone="danger">{WITH_ERROR}</Badge>
    case 'INTERRUPTED':
      return <Badge>{INTERRUPTED}</Badge>
    default:
      return run satisfies never
  }
}

/** A moment in the list's short form: "02/11 10:00". */
export function whenText(instant: string): string {
  return `${dayAndMonth(instant)} ${clockOf(instant)}`
}

/** When a round ended, or a dash while it runs or before there is one. */
export function endedText(run: LakeRun | null): string {
  return run === null || run.outcome === 'RUNNING' ? NO_VALUE : whenText(run.endedAt)
}
