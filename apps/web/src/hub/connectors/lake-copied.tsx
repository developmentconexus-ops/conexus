import type {
  CompanyId,
  ConnectionId,
  ConnectorEntry,
  LakeInterval,
  LakeTablesOfConnection,
} from '@conexus/hub-api'
import { LAKE_INTERVAL_DEFAULT } from '@conexus/hub-api'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronDownIcon } from 'lucide-react'
import { useState } from 'react'
import { dayAndHour } from '../../platform/dates.ts'
import { HubFailure, sentenceOf } from '../../platform/hub.ts'
import { Alert } from '../../ui/alert.tsx'
import { Button } from '../../ui/button.tsx'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../../ui/collapsible.tsx'
import { SectionTitle } from '../../ui/list.tsx'
import { IntervalField } from './interval-field.tsx'
import { CopiedRow } from './lake-copied-row.tsx'
import type { Picks } from './lake-pick.ts'
import { copyBody, groupsOf, isFuture, picksOfCopied, prefixOf } from './lake-pick.ts'
import { Group, LakePicker } from './lake-picker.tsx'
import { lakeTablesPrefix, sendLakeCopy, sendLakeRun } from './lake-queries.ts'
import { ReadAgainDialog, readAgainTables } from './lake-read-again.tsx'
import {
  dateEffectText,
  LAKE_TABLES,
  LINES_STAY,
  lastRunText,
  otherTablesText,
  READ_AGAIN,
  RUN_NOW,
  SAVE,
  sinceOfTableText,
  WHOLE_HISTORY,
} from './lake-text.ts'
import { intervalText } from './lake-words.ts'
import { SinceField } from './since-field.tsx'

type Lake = LakeTablesOfConnection
type Props = { companyId: CompanyId; connectionId: ConnectionId; entry: ConnectorEntry; lake: Lake }

const NAME_REFUSALS: ReadonlySet<string> = new Set(['COPY_NAME_INVALID', 'COPY_NAME_TAKEN'])

function Controls(props: {
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
      <p className="text-text-2">
        {intervalText(props.interval)} ·{' '}
        {props.savedSince === '' ? WHOLE_HISTORY : sinceOfTableText(props.savedSince)}
      </p>
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

/** What the person has edited so far: the picks, the interval and the date, against what is saved. */
function useCopyEdit(props: Props) {
  const { lake } = props
  const [picks, setPicks] = useState<Picks>(() => picksOfCopied(lake.tables))
  const [interval, setInterval] = useState<LakeInterval>(lake.interval ?? LAKE_INTERVAL_DEFAULT)
  const savedSince = lake.startDate ?? ''
  const [since, setSince] = useState(savedSince)
  const [reading, setReading] = useState(false)
  const copied = lake.tables.filter((one) => one.copy.kind === 'MARKED')
  const others = lake.tables.filter((one) => one.copy.kind === 'UNMARKED')
  const marks = copied.filter((one) => picks.marked.has(one.source)).length
  const dirty =
    interval !== (lake.interval ?? LAKE_INTERVAL_DEFAULT) ||
    since !== savedSince ||
    marks !== copied.length ||
    others.some((one) => picks.marked.has(one.source))
  return {
    ...{ picks, setPicks, interval, setInterval, since, setSince, savedSince },
    ...{ reading, setReading, copied, others, dirty, again: readAgainTables(lake.tables) },
  }
}

type Edit = ReturnType<typeof useCopyEdit>

/** The two writes of the section: "Salvar" sets the copy, "Rodar agora" and "Ler de novo" ask for a round. */
function useCopyWrites(props: Props, edit: Edit) {
  const { companyId, connectionId, entry, lake } = props
  const { picks, interval, since, savedSince, setReading } = edit
  const hasTypedName = Object.keys(picks.parts).some((source) => picks.marked.has(source))
  const [note, setNote] = useState<string | null>(null)
  const [failure, setFailure] = useState<string | null>(null)
  const [nameRefusal, setNameRefusal] = useState<string | null>(null)
  const queryClient = useQueryClient()
  const save = useMutation(sendLakeCopy)
  const run = useMutation(sendLakeRun)
  const params = { companyId, connectionId }
  const running = lake.lastRun?.outcome === 'RUNNING' || run.isPending

  function stale() {
    void queryClient.invalidateQueries({ queryKey: lakeTablesPrefix(companyId, connectionId) })
  }

  async function submit() {
    setFailure(null)
    setNameRefusal(null)
    try {
      const body = copyBody({
        prefix: prefixOf(entry.id),
        tables: lake.tables,
        picks,
        interval,
        since,
      })
      await save.mutateAsync({ params, body })
    } catch (error) {
      if (error instanceof HubFailure && NAME_REFUSALS.has(error.code) && hasTypedName) {
        setNameRefusal(sentenceOf(error))
      } else {
        setFailure(sentenceOf(error))
      }
      return
    }
    setNote(dateEffectText(savedSince, since))
    stale()
  }

  async function start(whole: boolean) {
    setFailure(null)
    try {
      await run.mutateAsync({ params, body: { whole } })
    } catch (error) {
      setFailure(sentenceOf(error))
    }
    setReading(false)
    stale()
  }

  return {
    note,
    failure,
    nameRefusal,
    running,
    saving: save.isPending,
    pending: run.isPending,
    submit,
    start,
  }
}

/** "Rodar agora", "Ler de novo desde a data" and the last round, under the controls. */
function RunBar(props: {
  lake: Props['lake']
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
      {props.editable && (
        <Button disabled={props.running} onClick={props.onRun}>
          {RUN_NOW}
        </Button>
      )}
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

/**
 * The copied tables of a connection and everything that changes them: the boxes, the other tables
 * of the system, the interval and "Desde", "Salvar", "Rodar agora" and "Ler de novo desde a data".
 * Who does not manage copies reads the list and nothing else.
 */
export function CopiedTables(props: Props & { editable: boolean }) {
  const { entry, lake } = props
  const edit = useCopyEdit(props)
  const writes = useCopyWrites(props, edit)
  const { picks, setPicks, interval, setInterval, since, setSince, savedSince } = edit
  const { copied, others, dirty, again, reading, setReading } = edit
  const { note, failure, nameRefusal, running, submit, start } = writes
  return (
    <section aria-label={LAKE_TABLES} className="flex flex-col gap-lg">
      <div className="flex flex-col gap-xs">
        <SectionTitle>{LAKE_TABLES}</SectionTitle>
        <p className="max-w-message text-text-2">{LINES_STAY}</p>
      </div>
      {groupsOf(copied, entry.subjects).map((group) => (
        <Group key={group.id} label={group.label}>
          {group.tables.map((table) => (
            <CopiedRow
              key={table.source}
              table={table}
              picks={picks}
              since={lake.startDate}
              running={running}
              system={entry.name}
              editable={props.editable}
              onPicks={setPicks}
            />
          ))}
        </Group>
      ))}
      {props.editable && others.length > 0 && (
        <Collapsible>
          <CollapsibleTrigger className="inline-flex h-control items-center gap-xs rounded-control text-label text-text-2 hover:text-text">
            <ChevronDownIcon aria-hidden="true" className="size-4" />
            {otherTablesText(entry.name, others.length)}
          </CollapsibleTrigger>
          <CollapsibleContent>
            <LakePicker
              entry={entry}
              tables={others}
              picks={picks}
              refusal={nameRefusal}
              search={false}
              onPicks={setPicks}
            />
          </CollapsibleContent>
        </Collapsible>
      )}
      <Controls
        editable={props.editable}
        interval={interval}
        since={since}
        savedSince={savedSince}
        dirty={dirty}
        saving={writes.saving}
        onInterval={setInterval}
        onSince={setSince}
        onSave={() => void submit()}
      />
      {note !== null && !dirty && (
        <p role="status" className="max-w-message">
          {note}
        </p>
      )}
      {failure !== null && <Alert tone="danger">{failure}</Alert>}
      <RunBar
        lake={lake}
        editable={props.editable}
        running={running}
        stale={since !== savedSince}
        again={again.length}
        onRun={() => void start(false)}
        onReadAgain={() => setReading(true)}
      />
      <ReadAgainDialog
        open={reading}
        since={savedSince}
        system={entry.name}
        tables={again}
        pending={writes.pending}
        onConfirm={() => void start(true)}
        onCancel={() => setReading(false)}
      />
    </section>
  )
}
