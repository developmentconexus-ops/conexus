import type { LakeInterval, LakeTablesOfConnection } from '@conexus/hub-api'
import { dayAndHour } from '../../platform/dates.ts'
import { Button } from '../../ui/button.tsx'
import { IntervalField } from './interval-field.tsx'
import { isFuture } from './lake-pick.ts'
import {
  lastRunText,
  READ_AGAIN,
  RUN_NOW,
  SAVE,
  sinceOfTableText,
  WHOLE_HISTORY,
} from './lake-text.ts'
import { intervalText } from './lake-words.ts'
import { SinceField } from './since-field.tsx'

export function Controls(props: {
  editable: boolean
  interval: LakeInterval
  since: string
  savedSince: string
  dirty: boolean
  saving: boolean
  onInterval: (interval: LakeInterval) => void
  onSince: (since: string) => void
  onSave: () => void
}) {
  if (!props.editable) {
    return (
      <div className="flex flex-wrap items-center gap-md">
        <p className="text-text-2">
          {intervalText(props.interval)} ·{' '}
          {props.savedSince === '' ? WHOLE_HISTORY : sinceOfTableText(props.savedSince)}
        </p>
        <Button variant="primary" disabled>
          {SAVE}
        </Button>
      </div>
    )
  }
  return (
    <div className="grid gap-lg md:grid-cols-2">
      <IntervalField value={props.interval} onChange={props.onInterval} />
      <SinceField value={props.since} onChange={props.onSince} help={false} />
      <div className="flex flex-wrap gap-md md:col-span-2">
        <Button
          variant="primary"
          disabled={!props.dirty || props.saving || isFuture(props.since)}
          onClick={props.onSave}
        >
          {SAVE}
        </Button>
      </div>
    </div>
  )
}

/** "Rodar agora", "Ler de novo desde a data" and the last round, under the controls. */
export function RunBar(props: {
  lake: LakeTablesOfConnection
  editable: boolean
  running: boolean
  stale: boolean
  again: number
  onRun: () => void
  onReadAgain: () => void
}) {
  const { lake } = props
  return (
    <div className="flex flex-wrap items-center gap-md border-t border-line pt-md">
      <Button disabled={!props.editable || props.running} onClick={props.onRun}>
        {RUN_NOW}
      </Button>
      {props.editable && props.again > 0 && (
        <Button disabled={props.stale || props.running} onClick={props.onReadAgain}>
          {READ_AGAIN}
        </Button>
      )}
      {lake.lastRun !== null && lake.lastRun.outcome !== 'RUNNING' && (
        <p className="text-text-2 tabular-nums">{lastRunText(dayAndHour(lake.lastRun.endedAt))}</p>
      )}
    </div>
  )
}
