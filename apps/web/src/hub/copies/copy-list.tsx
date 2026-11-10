import type { CompanyId, CopySummary } from '@conexus/hub-api'
import type { UseQueryResult } from '@tanstack/react-query'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { MoreHorizontalIcon } from 'lucide-react'
import { useState } from 'react'
import { dayAndHour } from '../../platform/dates.ts'
import { sentenceOf, writeFailureText } from '../../platform/hub.ts'
import { Badge } from '../../ui/badge.tsx'
import { Button } from '../../ui/button.tsx'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../ui/dropdown-menu.tsx'
import { List, PageTitle, Row } from '../../ui/list.tsx'
import { Skeleton } from '../../ui/skeleton.tsx'
import { Empty, ReadFailure } from '../../ui/states.tsx'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table.tsx'
import { useIsMobile } from '../../ui/use-mobile.ts'
import { IntervalDialog } from './interval.tsx'
import { NewCopy } from './new-copy.tsx'
import { copiesQuery, sendCopyPause, sendCopyResume, sendCopyRun } from './queries.ts'
import { useRunRequests } from './run-requests.ts'
import {
  COPIES_TITLE,
  countText,
  durationText,
  INTERVAL_LABEL,
  NO_COPIES,
  NO_SCHEDULE,
  outcomeText,
  RUN_REQUESTED,
  stateOf,
  UNCONFIRMED_ACTION,
} from './text.ts'

// The eight columns and the menu fit beside the rail at 1280px, so a cell's padding is `sm`, not the table's `md`.
const CELL = 'px-sm'

export type Note = { kind: 'ok' | 'error'; text: string }

const NOTE_LINE = {
  ok: { role: 'status', tone: 'text-text-2' },
  error: { role: 'alert', tone: 'text-danger' },
} as const

/** What an action told: the Hub's sentence for a refusal, or that the request went. */
export function NoteLine({ note }: { note: Note }) {
  const line = NOTE_LINE[note.kind]
  return (
    <p role={line.role} className={line.tone}>
      {note.text}
    </p>
  )
}

/** The state of a copy as a word with its dot (design V35). */
export function StateBadge({ copy }: { copy: Pick<CopySummary, 'run' | 'schedule'> }) {
  const state = stateOf(copy)
  return <Badge tone={state.tone}>{state.label}</Badge>
}

/** The line under a state: why the last run failed or stopped, in the phrase of its code. */
function RunPhrase({ copy }: { copy: CopySummary }) {
  const outcome = copy.run?.outcome.kind
  if (copy.run === null || outcome === 'COMPLETE' || outcome === 'RUNNING') return null
  return <span className="text-text-2">{outcomeText(copy.run)}</span>
}

/** Rodar agora: the request, what it told, and the run the copy showed when it left (the list follows it until a newer one appears). */
function useRunNow(companyId: CompanyId, copy: CopySummary, onNote: (note: Note) => void) {
  const run = useMutation({ ...sendCopyRun, meta: { before: copy.run?.id ?? null } })
  function start() {
    run.mutate(
      { params: { companyId, copyId: copy.id } },
      {
        onSuccess: () => onNote({ kind: 'ok', text: RUN_REQUESTED }),
        onError: (error) => onNote(failedNote(error)),
      },
    )
  }
  return { start, pending: run.isPending, available: copy.schedule.kind !== 'MISSING' }
}

function failedNote(error: unknown): Note {
  return { kind: 'error', text: writeFailureText(error, UNCONFIRMED_ACTION) }
}

/** The detail's own **Rodar agora**, beside its menu; a copy with no clock has none (the Hub answers `NO_SCHEDULE`). */
export function RunNowButton(props: {
  companyId: CompanyId
  copy: CopySummary
  onNote: (note: Note) => void
}) {
  const now = useRunNow(props.companyId, props.copy, props.onNote)
  if (!now.available) return null
  return (
    <Button variant="primary" disabled={now.pending} onClick={now.start}>
      {now.pending ? 'Pedindo…' : 'Rodar agora'}
    </Button>
  )
}

/**
 * The actions of one copy (criterion 33): **Rodar agora** (not on a copy with no clock, and not in
 * the detail, which has its own button), **Pausar** or **Retomar**, and **Intervalo**, which opens
 * its dialog. Each tells its refusal in the Hub's sentence through `onNote`.
 */
export function CopyMenu(props: {
  companyId: CompanyId
  copy: CopySummary
  onNote: (note: Note | undefined) => void
  withRun?: boolean
}) {
  const { companyId, copy, onNote, withRun = true } = props
  const [choosing, setChoosing] = useState(false)
  const params = { companyId, copyId: copy.id }
  const pause = useMutation(sendCopyPause)
  const resume = useMutation(sendCopyResume)
  const now = useRunNow(companyId, copy, onNote)
  const busy = pause.isPending || resume.isPending || now.pending
  const toggle = copy.schedule.kind === 'ACTIVE' ? pause : resume
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button size="icon-sm" variant="ghost" aria-label={`Ações: ${copy.label}`} />}
        >
          <MoreHorizontalIcon aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuGroup>
            {withRun && now.available && (
              <DropdownMenuItem disabled={busy} onClick={now.start}>
                Rodar agora
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              disabled={busy}
              onClick={() =>
                toggle.mutate(
                  { params },
                  { onSuccess: () => onNote(undefined), onError: (e) => onNote(failedNote(e)) },
                )
              }
            >
              {copy.schedule.kind === 'ACTIVE' ? 'Pausar' : 'Retomar'}
            </DropdownMenuItem>
            <DropdownMenuItem disabled={busy} onClick={() => setChoosing(true)}>
              Intervalo
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <IntervalDialog
        companyId={companyId}
        copy={copy}
        open={choosing}
        onOpenChange={setChoosing}
      />
    </>
  )
}

function projectsText(copy: CopySummary): string {
  return copy.projects.length === 0 ? NO_SCHEDULE : copy.projects.map((p) => p.name).join(', ')
}

function intervalText(copy: CopySummary): string {
  return copy.interval === null ? NO_SCHEDULE : INTERVAL_LABEL[copy.interval]
}

function CopyLink({ companyId, copy }: { companyId: CompanyId; copy: CopySummary }) {
  return (
    <Link
      to="/companies/$companyId/copies/$copyId"
      params={{ companyId, copyId: copy.id }}
      className="font-medium hover:underline"
    >
      {copy.label}
    </Link>
  )
}

function CopyTableRow(props: { companyId: CompanyId; copy: CopySummary; onNote: Props['onNote'] }) {
  const { companyId, copy } = props
  const { run } = copy
  return (
    <TableRow>
      <TableCell className={`${CELL} max-w-36 truncate`} title={copy.connection.name}>
        {copy.connection.name}
      </TableCell>
      <TableCell className={CELL}>
        <CopyLink companyId={companyId} copy={copy} />
      </TableCell>
      <TableCell className={`${CELL} whitespace-normal`}>
        <div className="flex flex-col items-start gap-xs">
          <StateBadge copy={copy} />
          <RunPhrase copy={copy} />
        </div>
      </TableCell>
      <TableCell className={`${CELL} tabular-nums`}>
        {run === null ? '—' : dayAndHour(run.startedAt)}
      </TableCell>
      <TableCell className={`${CELL} tabular-nums`}>
        {run === null ? '—' : durationText(run)}
      </TableCell>
      <TableCell className={`${CELL} text-right tabular-nums`}>
        {copy.rows === null ? '—' : countText(copy.rows)}
      </TableCell>
      <TableCell className={CELL}>{intervalText(copy)}</TableCell>
      <TableCell className={`${CELL} max-w-40 whitespace-normal`}>{projectsText(copy)}</TableCell>
      <TableCell className={CELL}>
        <CopyMenu companyId={companyId} copy={copy} onNote={props.onNote} />
      </TableCell>
    </TableRow>
  )
}

const HEADS = [
  'Fonte',
  'Dado',
  'Estado',
  'Última rodada',
  'Duração',
  'Linhas',
  'Intervalo',
  'Projetos',
] as const

type Props = { companyId: CompanyId; copies: CopySummary[]; onNote: (note?: Note) => void }

function CopyTable({ companyId, copies, onNote }: Props) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {HEADS.map((head) => (
            <TableHead key={head} className={CELL}>
              {head}
            </TableHead>
          ))}
          <TableHead className={CELL}>
            <span className="sr-only">Ações</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {copies.map((copy) => (
          <CopyTableRow key={copy.id} companyId={companyId} copy={copy} onNote={onNote} />
        ))}
      </TableBody>
    </Table>
  )
}

/** The phone's row: the same facts in lines that break, as the Agentes' do. */
function CopyPhoneRow(props: { companyId: CompanyId; copy: CopySummary; onNote: Props['onNote'] }) {
  const { companyId, copy } = props
  return (
    <Row>
      <div className="flex min-w-0 flex-col gap-xs px-sm py-md">
        <div className="flex min-w-0 items-center justify-between gap-md">
          <span className="min-w-0 truncate">
            <CopyLink companyId={companyId} copy={copy} />
            <span className="text-text-2">{` · ${copy.connection.name}`}</span>
          </span>
          <CopyMenu companyId={companyId} copy={copy} onNote={props.onNote} />
        </div>
        <div className="flex flex-wrap items-center gap-x-md gap-y-xs text-text-2">
          <StateBadge copy={copy} />
          {copy.run !== null && <span>{dayAndHour(copy.run.startedAt)}</span>}
        </div>
        <RunPhrase copy={copy} />
        <p className="break-words text-text-2 tabular-nums">
          {`${copy.rows === null ? '—' : `${countText(copy.rows)} linhas`} · ${intervalText(copy)}`}
        </p>
        {copy.projects.length > 0 && <p className="break-words">{projectsText(copy)}</p>}
      </div>
    </Row>
  )
}

/** The copies of the read in the shape of the screen: a table, or on a phone rows that break. */
function Copies(props: {
  companyId: CompanyId
  read: UseQueryResult<{ copies: CopySummary[] }>
  onNote: Props['onNote']
}) {
  const { companyId, read, onNote } = props
  const phone = useIsMobile()
  if (read.isPending) return <Skeleton className="h-24 w-full" />
  if (read.isError) {
    return <ReadFailure text={sentenceOf(read.error)} onRetry={() => void read.refetch()} />
  }
  const { copies } = read.data
  if (copies.length === 0) return <Empty>{NO_COPIES}</Empty>
  if (!phone) return <CopyTable companyId={companyId} copies={copies} onNote={onNote} />
  return (
    <List>
      {copies.map((copy) => (
        <CopyPhoneRow key={copy.id} companyId={companyId} copy={copy} onNote={onNote} />
      ))}
    </List>
  )
}

/**
 * **Cópias** (Capacidade 2, U4; web W29): every copy of the company with its source, its state and
 * last run, its rows, interval and Projetos, and the actions of its row. Empty, it says what a copy
 * is and offers **Ligar uma cópia**. The list follows itself while a run is open.
 */
export function CopyList({ companyId }: { companyId: CompanyId }) {
  const read = useQuery(copiesQuery(companyId, useRunRequests()))
  const [note, setNote] = useState<Note>()
  return (
    <div className="mx-auto flex w-full max-w-page flex-col gap-xl">
      <div className="flex flex-wrap items-center justify-between gap-md">
        <PageTitle>{COPIES_TITLE}</PageTitle>
        <NewCopy companyId={companyId} />
      </div>
      {note !== undefined && <NoteLine note={note} />}
      <Copies companyId={companyId} read={read} onNote={setNote} />
    </div>
  )
}
