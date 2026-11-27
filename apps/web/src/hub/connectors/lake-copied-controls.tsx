import type { LakeFullPass, LakeInterval, LakeTablesOfConnection } from '@conexus/hub-api'
import { useState } from 'react'
import { clockOf, dayAndHour } from '../../platform/dates.ts'
import { Button } from '../../ui/button.tsx'
import { FullPassField } from './full-pass-field.tsx'
import { IntervalField } from './interval-field.tsx'
import { isFuture, isMarked } from './lake-pick.ts'
import { StopDialog } from './lake-read-again.tsx'
import {
  FULL_PASS_MANUAL,
  fullPassNextText,
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
  fullPass: LakeFullPass
  fullNext: string | null
  dirty: boolean
  saving: boolean
  onInterval: (interval: LakeInterval) => void
  onFullPass: (fullPass: LakeFullPass) => void
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
        <p className="text-text-2 tabular-nums">
          {props.interval === 'MANUAL' ? FULL_PASS_MANUAL : fullPassNextText(props.fullNext)}
        </p>
        <Button variant="primary" disabled>
          {SAVE}
        </Button>
      </div>
    )
  }
  return (
    <div className="grid grid-cols-1 gap-lg md:grid-cols-2">
      <div className="md:col-span-2">
        <IntervalField value={props.interval} onChange={props.onInterval} />
      </div>
      <SinceField value={props.since} onChange={props.onSince} help={false} />
      <FullPassField
        value={props.fullPass}
        manual={props.interval === 'MANUAL'}
        onChange={props.onFullPass}
      >
        <p className="text-text-2 tabular-nums">{fullPassNextText(props.fullNext)}</p>
      </FullPassField>
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

export function RunBar(props: {
  lake: LakeTablesOfConnection
  editable: boolean
  running: boolean
  stale: boolean
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
      <Button
        disabled={!props.editable || props.stale || props.running}
        onClick={props.onReadAgain}
      >
        {READ_AGAIN}
      </Button>
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
