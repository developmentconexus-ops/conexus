import type { CompanyId, CopySummary } from '@conexus/hub-api'
import { Link } from '@tanstack/react-router'
import { dayAndHour } from '../../platform/dates.ts'
import { Badge } from '../../ui/badge.tsx'
import { Row } from '../../ui/list.tsx'
import { TableCell, TableHead, TableHeader, TableRow } from '../../ui/table.tsx'
import { countText, INTERVAL_LABEL, modeText, NO_SCHEDULE, outcomeText, stateOf } from './text.ts'

export const CELL = 'px-sm'

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
      to="/companies/$companyId/data/$copyId"
      params={{ companyId, copyId: copy.id }}
      className="font-medium font-mono text-fact hover:underline"
    >
      {copy.name}
    </Link>
  )
}

export function CopyTableRow(props: { companyId: CompanyId; copy: CopySummary }) {
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
    </TableRow>
  )
}

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
      </TableRow>
    </TableHeader>
  )
}

/** The phone's row: the same facts in lines that break, as the Agentes' do. */
export function CopyPhoneRow(props: { companyId: CompanyId; copy: CopySummary }) {
  const { companyId, copy } = props
  return (
    <Row>
      <div className="flex min-w-0 flex-col gap-xs px-sm py-md">
        <span className="min-w-0 truncate">
          <CopyLink companyId={companyId} copy={copy} />
        </span>
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
