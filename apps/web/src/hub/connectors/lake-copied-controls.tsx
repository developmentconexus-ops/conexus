import type { LakeInterval, LakeTablesOfConnection } from '@conexus/hub-api'
import { useState } from 'react'
import { clockOf, dayAndHour } from '../../platform/dates.ts'
import { Button } from '../../ui/button.tsx'
import { IntervalField } from './interval-field.tsx'
import { isFuture, isMarked } from './lake-pick.ts'
import { StopDialog } from './lake-read-again.tsx'
import {
  lastRunText,
  READ_AGAIN,
  RUN_NOW,
  SAVE,
  STOP_COPY,
  STOPPING,
  sinceOfTableText,
  stoppedByText,
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

type Ended = Exclude<NonNullable<LakeTablesOfConnection['lastRun']>, { outcome: 'RUNNING' }>

function endedText(round: Ended) {
  if (round.outcome === 'INTERRUPTED' && round.stoppedBy !== null)
    return stoppedByText(round.stoppedBy.name, clockOf(round.endedAt))
  return lastRunText(dayAndHour(round.endedAt))
}

/** "Rodar agora", "Parar cópia" while a round is open, "Ler de novo desde a data" and the last round, under the controls. */
export function RunBar(props: {
  lake: LakeTablesOfConnection
  editable: boolean
  running: boolean
  stale: boolean
  again: number
  stop: { stopping: boolean; pending: boolean; send: () => Promise<void> }
  onRun: () => void
  onReadAgain: () => void
}) {
  const { lake, stop } = props
  const [asking, setAsking] = useState(false)
  return (
    <div className="flex flex-wrap items-center gap-md border-t border-line pt-md">
      <Button disabled={!props.editable || props.running} onClick={props.onRun}>
        {RUN_NOW}
      </Button>
      {lake.lastRun?.outcome === 'RUNNING' && (
        <Button
          disabled={!props.editable || stop.stopping}
          focusableWhenDisabled={stop.stopping}
          onClick={() => setAsking(true)}
        >
          {stop.stopping ? STOPPING : STOP_COPY}
        </Button>
      )}
      {props.again > 0 && (
        <Button
          disabled={!props.editable || props.stale || props.running}
          onClick={props.onReadAgain}
        >
          {READ_AGAIN}
        </Button>
      )}
      {lake.lastRun !== null && lake.lastRun.outcome !== 'RUNNING' && (
        <p className="text-text-2 tabular-nums">{endedText(lake.lastRun)}</p>
      )}
      <StopDialog
        open={asking}
        tables={lake.tables.filter(isMarked)}
        pending={stop.pending}
        onConfirm={async () => {
          await stop.send()
          setAsking(false)
        }}
        onCancel={() => setAsking(false)}
      />
    </div>
  )
}
