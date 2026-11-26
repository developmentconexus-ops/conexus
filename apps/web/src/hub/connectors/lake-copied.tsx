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
import { HubFailure, sentenceOf } from '../../platform/hub.ts'
import { Alert } from '../../ui/alert.tsx'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../../ui/collapsible.tsx'
import { SectionTitle } from '../../ui/list.tsx'
import { Controls, RunBar } from './lake-copied-controls.tsx'
import { CopiedRow } from './lake-copied-row.tsx'
import type { Picks, Table } from './lake-pick.ts'
import { copyBody, groupsOf, isMarked, picksOfCopied, prefixOf } from './lake-pick.ts'
import { Group, LakePicker } from './lake-picker.tsx'
import { lakeTablesPrefix, sendLakeCopy, sendLakeRun, sendLakeStop } from './lake-queries.ts'
import { LeaveDialog, ReadAgainDialog, readAgainTables } from './lake-read-again.tsx'
import {
  dateEffectText,
  LAKE_TABLES,
  ONLY_COPY_MANAGER,
  otherTablesText,
  SECTION_LEAD,
} from './lake-text.ts'

type Lake = LakeTablesOfConnection
type Props = { companyId: CompanyId; connectionId: ConnectionId; entry: ConnectorEntry; lake: Lake }

const NAME_REFUSALS: ReadonlySet<string> = new Set(['COPY_NAME_INVALID', 'COPY_NAME_TAKEN'])

/** What the person has edited so far: the picks, the interval and the date, against what is saved. */
function useCopyEdit(props: Props) {
  const { lake } = props
  const [picks, setPicks] = useState<Picks>(() => picksOfCopied(lake.tables))
  const [interval, setInterval] = useState<LakeInterval>(lake.interval ?? LAKE_INTERVAL_DEFAULT)
  const savedSince = lake.startDate ?? ''
  const [since, setSince] = useState(savedSince)
  const [reading, setReading] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const copied = lake.tables.filter(isMarked)
  const others = lake.tables.filter((one) => one.copy.kind === 'UNMARKED')
  const leaving = copied.filter((one) => !picks.marked.has(one.source))
  const dirty =
    interval !== (lake.interval ?? LAKE_INTERVAL_DEFAULT) ||
    since !== savedSince ||
    leaving.length > 0 ||
    others.some((one) => picks.marked.has(one.source))
  return {
    ...{ picks, setPicks, interval, setInterval, since, setSince, savedSince },
    ...{ reading, setReading, confirming, setConfirming, leaving },
    ...{ copied, others, dirty, again: readAgainTables(lake.tables) },
  }
}

type Edit = ReturnType<typeof useCopyEdit>

/** The writes of the section: "Salvar" sets the copy, "Rodar agora" and "Ler de novo" ask for a round, "Parar cópia" asks the open one to stop. */
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
  const stop = useMutation(sendLakeStop)
  const [refusedStop, setRefusedStop] = useState<string | null>(null)
  const params = { companyId, connectionId }
  const round = lake.lastRun?.outcome === 'RUNNING' ? lake.lastRun : null
  const running = round !== null || run.isPending
  // The Hub may keep an ask whose request it refused, so that round offers the stop again.
  const stopping = round?.stopping === true && round.id !== refusedStop

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

  async function stopRound() {
    setFailure(null)
    setRefusedStop(null)
    try {
      await stop.mutateAsync({ params })
    } catch (error) {
      setRefusedStop(round?.id ?? null)
      setFailure(sentenceOf(error))
    }
  }

  return {
    note,
    failure,
    nameRefusal,
    running,
    stop: { stopping, pending: stop.isPending, send: stopRound },
    saving: save.isPending,
    pending: run.isPending,
    submit,
    start,
  }
}

/** The copied tables under their subjects. */
function CopiedList(props: {
  tables: Table[]
  entry: ConnectorEntry
  picks: Picks
  since: string | null
  running: boolean
  editable: boolean
  onPicks: (picks: Picks) => void
}) {
  return groupsOf(props.tables, props.entry.subjects).map((group) => (
    <Group key={group.id} label={group.label}>
      {group.tables.map((table) => (
        <CopiedRow
          key={table.source}
          table={table}
          picks={props.picks}
          since={props.since}
          running={props.running}
          system={props.entry.name}
          editable={props.editable}
          onPicks={props.onPicks}
        />
      ))}
    </Group>
  ))
}

function Heading(props: { editable: boolean }) {
  return (
    <div className="flex flex-col gap-xs">
      <SectionTitle>{LAKE_TABLES}</SectionTitle>
      <p className="max-w-message text-text-2">{SECTION_LEAD}</p>
      {!props.editable && <p className="max-w-message text-text-2">{ONLY_COPY_MANAGER}</p>}
    </div>
  )
}

/** What the last "Salvar", run or stop said: the effect of the date once saved, or why it did not go. */
function Outcome(props: { note: string | null; failure: string | null }) {
  return (
    <>
      {props.note !== null && (
        <p role="status" className="max-w-message">
          {props.note}
        </p>
      )}
      {props.failure !== null && <Alert tone="danger">{props.failure}</Alert>}
    </>
  )
}

/** The system's other tables, folded away, to mark one more for the lake. */
function OtherTables(props: {
  entry: ConnectorEntry
  others: Table[]
  picks: Picks
  refusal: string | null
  onPicks: (picks: Picks) => void
}) {
  return (
    <Collapsible>
      <CollapsibleTrigger className="inline-flex h-control items-center gap-xs rounded-control text-label text-text-2 hover:text-text">
        <ChevronDownIcon aria-hidden="true" className="size-4" />
        {otherTablesText(props.entry.name, props.others.length)}
      </CollapsibleTrigger>
      <CollapsibleContent>
        <LakePicker
          entry={props.entry}
          tables={props.others}
          picks={props.picks}
          refusal={props.refusal}
          search={false}
          onPicks={props.onPicks}
        />
      </CollapsibleContent>
    </Collapsible>
  )
}

/**
 * The copied tables of a connection and everything that changes them: the boxes, the other tables
 * of the system, the interval and "Desde", "Salvar", "Rodar agora" and "Ler de novo desde a data".
 * Who does not manage copies sees the same controls turned off, with the sentence that says who can.
 */
export function CopiedTables(props: Props & { editable: boolean }) {
  const { entry, lake } = props
  const edit = useCopyEdit(props)
  const writes = useCopyWrites(props, edit)
  const { picks, setPicks, interval, setInterval, since, setSince, savedSince } = edit
  const { copied, others, dirty, again, reading, setReading } = edit
  const { leaving, confirming, setConfirming } = edit
  const { note, failure, nameRefusal, running, submit, start } = writes
  return (
    <section aria-label={LAKE_TABLES} className="flex flex-col gap-lg">
      <Heading editable={props.editable} />
      <CopiedList
        tables={copied}
        entry={entry}
        picks={picks}
        since={lake.startDate}
        running={running}
        editable={props.editable}
        onPicks={setPicks}
      />
      {props.editable && others.length > 0 && (
        <OtherTables
          entry={entry}
          others={others}
          picks={picks}
          refusal={nameRefusal}
          onPicks={setPicks}
        />
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
        onSave={() => (leaving.length > 0 ? setConfirming(true) : void submit())}
      />
      <Outcome note={dirty ? null : note} failure={failure} />
      <RunBar
        lake={lake}
        editable={props.editable}
        running={running}
        stale={since !== savedSince}
        again={again.length}
        stop={writes.stop}
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
      <LeaveDialog
        open={confirming}
        tables={leaving}
        pending={writes.saving}
        onConfirm={() => void submit().then(() => setConfirming(false))}
        onCancel={() => setConfirming(false)}
      />
    </section>
  )
}
