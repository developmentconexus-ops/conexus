import type { CompanyId, CopyProposalSummary, CopySummary } from '@conexus/hub-api'
import { useMutation } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { MoreHorizontalIcon } from 'lucide-react'
import { useState } from 'react'
import { dayAndHour } from '../../platform/dates.ts'
import { writeFailureText } from '../../platform/hub.ts'
import { Badge } from '../../ui/badge.tsx'
import { Button } from '../../ui/button.tsx'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../ui/dropdown-menu.tsx'
import { List, Row } from '../../ui/list.tsx'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table.tsx'
import { useIsMobile } from '../../ui/use-mobile.ts'
import { CopyDeleteDialog } from './copy-delete.tsx'
import { ProposalPhoneRow, ProposalTableRow } from './copy-proposal.tsx'
import { IntervalDialog } from './interval.tsx'
import type { RunRequest } from './queries.ts'
import { requestOpen, sendCopyPause, sendCopyResume, sendCopyRun } from './queries.ts'
import {
  countText,
  INTERVAL_LABEL,
  modeText,
  NO_SCHEDULE,
  outcomeText,
  RUN_REQUESTED,
  stateOf,
  UNCONFIRMED_ACTION,
} from './text.ts'

// The eight columns and the menu fit beside the rail at 1280px, so a cell's padding is `sm`, not the table's `md`.
export const CELL = 'px-sm'

/** What an action told: a refusal, or that the request went, with the run it asked for. */
export type Note =
  | { kind: 'error'; text: string }
  | { kind: 'ok'; text: string; request: RunRequest }

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

/**
 * The note on screen. A refusal stays until the next action; "Pedido enviado" goes for good once the
 * run it asked for is no longer owed or open, so a later run of the clock never brings it back.
 */
export function useNote(copies: readonly Pick<CopySummary, 'id' | 'run'>[]) {
  const [note, setNote] = useState<Note>()
  if (note?.kind === 'ok') {
    const run = copies.find((copy) => copy.id === note.request.copyId)?.run ?? null
    if (!requestOpen(note.request, run)) setNote(undefined)
  }
  return [note, setNote] as const
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
        onSuccess: () =>
          onNote({
            kind: 'ok',
            text: RUN_REQUESTED,
            request: { copyId: copy.id, at: Date.now(), before: copy.run?.id ?? null },
          }),
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
 * the detail, which has its own button), **Pausar** or **Retomar**, and **Intervalo** and **Apagar**,
 * which open their dialogs. Each tells its refusal in the Hub's sentence through `onNote`; `onDeleted`
 * is where the screen goes once the copy is gone.
 */
export function CopyMenu(props: {
  companyId: CompanyId
  copy: CopySummary
  onNote: (note: Note | undefined) => void
  withRun?: boolean
  onDeleted?: () => void
}) {
  const { companyId, copy, onNote, withRun = true } = props
  const [choosing, setChoosing] = useState(false)
  const [deleting, setDeleting] = useState(false)
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
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-danger"
              disabled={busy}
              onClick={() => setDeleting(true)}
            >
              Apagar
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <CopyDeleteDialog
        companyId={companyId}
        copy={copy}
        open={deleting}
        onOpenChange={setDeleting}
        onDeleted={() => props.onDeleted?.()}
      />
      <IntervalDialog
        companyId={companyId}
        copy={copy}
        open={choosing}
        onOpenChange={setChoosing}
        onSaved={() => onNote(undefined)}
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

/** What the row says a table holds: its description, or the label of the copy when it has none. */
export function describedAs(copy: CopySummary): string {
  return copy.shown.description ?? copy.label
}

function CopyLink({ companyId, copy }: { companyId: CompanyId; copy: CopySummary }) {
  return (
    <Link
      to="/companies/$companyId/copies/$copyId"
      params={{ companyId, copyId: copy.id }}
      className="font-medium font-mono text-fact hover:underline"
    >
      {copy.name}
    </Link>
  )
}

export function CopyTableRow(props: {
  companyId: CompanyId
  copy: CopySummary
  onNote: Props['onNote']
}) {
  const { companyId, copy } = props
  const { run } = copy
  return (
    <TableRow>
      <TableCell className={`${CELL} whitespace-normal`}>
        <div className="flex flex-col">
          <CopyLink companyId={companyId} copy={copy} />
          <span className="text-text-2">{describedAs(copy)}</span>
        </div>
      </TableCell>
      <TableCell className={`${CELL} whitespace-normal`}>
        <div className="flex flex-col items-start gap-xs">
          <StateBadge copy={copy} />
          <span className="tabular-nums">{run === null ? '—' : dayAndHour(run.startedAt)}</span>
          <RunPhrase copy={copy} />
        </div>
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

const PROPOSAL_HEADS = [
  'Fonte',
  'Dado',
  'Estado',
  'Última rodada',
  'Duração',
  'Linhas',
  'Intervalo',
  'Projetos',
] as const

export type Props = {
  companyId: CompanyId
  copies: CopySummary[]
  proposals: CopyProposalSummary[]
  onNote: (note?: Note) => void
}

/** A refusal of a proposal's Ligar or Dispensar, as the page's note. */
function refusedOf(onNote: Props['onNote']) {
  return (text: string) => onNote({ kind: 'error', text })
}

/** A table's head: the named columns, the `right` one aligned to the right, and one for the row's actions. */
export function HeadRow(props: { heads: readonly string[]; right?: string }) {
  const { heads, right } = props
  return (
    <TableHeader>
      <TableRow>
        {heads.map((head) => (
          <TableHead key={head} className={head === right ? `${CELL} text-right` : CELL}>
            {head}
          </TableHead>
        ))}
        <TableHead className={CELL}>
          <span className="sr-only">Ações</span>
        </TableHead>
      </TableRow>
    </TableHeader>
  )
}

/** The Builder's open proposals, above the systems, each with **Ligar** and **Dispensar**. */
export function Proposals(props: Pick<Props, 'companyId' | 'proposals' | 'onNote'>) {
  const { companyId, proposals, onNote } = props
  const phone = useIsMobile()
  if (proposals.length === 0) return null
  if (phone) {
    return (
      <List>
        {proposals.map((proposal) => (
          <ProposalPhoneRow
            key={proposal.id}
            companyId={companyId}
            proposal={proposal}
            onRefused={refusedOf(onNote)}
          />
        ))}
      </List>
    )
  }
  return (
    <Table>
      <HeadRow heads={PROPOSAL_HEADS} />
      <TableBody>
        {proposals.map((proposal) => (
          <ProposalTableRow
            key={proposal.id}
            companyId={companyId}
            proposal={proposal}
            onRefused={refusedOf(onNote)}
            cell={CELL}
          />
        ))}
      </TableBody>
    </Table>
  )
}

/** The phone's row: the same facts in lines that break, as the Agentes' do. */
export function CopyPhoneRow(props: {
  companyId: CompanyId
  copy: CopySummary
  onNote: Props['onNote']
}) {
  const { companyId, copy } = props
  return (
    <Row>
      <div className="flex min-w-0 flex-col gap-xs px-sm py-md">
        <div className="flex min-w-0 items-center justify-between gap-md">
          <span className="min-w-0 truncate">
            <CopyLink companyId={companyId} copy={copy} />
          </span>
          <CopyMenu companyId={companyId} copy={copy} onNote={props.onNote} />
        </div>
        <p className="break-words text-text-2">{describedAs(copy)}</p>
        <div className="flex flex-wrap items-center gap-x-md gap-y-xs text-text-2">
          <StateBadge copy={copy} />
          <span className="break-words">{modeText(copy.mode)}</span>
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
