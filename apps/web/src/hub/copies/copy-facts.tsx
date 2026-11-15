import type { ConnectorEntry, CopySummary } from '@conexus/hub-api'
import type { ReactNode } from 'react'
import { Badge } from '../../ui/badge.tsx'
import { cn } from '../../ui/cn.ts'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table.tsx'
import { ConnectorLogo } from '../connectors/public.ts'
import {
  COLUMN_HEADS,
  countText,
  DETAILS_TITLE,
  frequencyText,
  inactiveMark,
  KEPT_IN_HUB,
  KEY_MARK,
  lastRunText,
  modeText,
  NO_DESCRIPTION,
  ORIGIN_READ,
  OVERVIEW_LABELS,
  PANEL_LABELS,
  typeText,
} from './text.ts'

/** The **Colunas** tab: each column in mono with its type in words and what it holds; the key marked, an inactive one dated. */
export function ColumnsTab({ copy }: { copy: CopySummary }) {
  const { columns, key } = copy.shown
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {COLUMN_HEADS.map((head) => (
            <TableHead key={head}>{head}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {columns.map((column) => (
          <TableRow key={column.name}>
            <TableCell className="whitespace-normal break-words">
              <span className="font-mono text-fact">{column.name}</span>
              {key.includes(column.name) && <Badge tone="neutral">{KEY_MARK}</Badge>}
            </TableCell>
            <TableCell>{typeText(column.type)}</TableCell>
            <TableCell className="whitespace-normal break-words">
              {column.description}
              {column.inactiveSince !== null && (
                <span className="block text-text-2">{inactiveMark(column.inactiveSince)}</span>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function Line({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col">
      <dt className="text-text-2">{label}</dt>
      <dd className="break-words">{children}</dd>
    </div>
  )
}

/** The **Visão geral** tab, the one a table opens on: its description, the connection, the key, the mode and, for a version 2 copy, the read it comes from. */
export function OverviewTab({ copy }: { copy: CopySummary }) {
  const { description, key, source } = copy.shown
  return (
    <div className="flex min-w-0 flex-col gap-lg">
      <p className={cn('max-w-message', description === null && 'text-text-2')}>
        {description ?? NO_DESCRIPTION}
      </p>
      <dl className="grid gap-md sm:grid-cols-2">
        <Line label={OVERVIEW_LABELS.connection}>
          {copy.sources.map((one) => one.connection.name).join(', ')}
        </Line>
        <Line label={OVERVIEW_LABELS.key}>
          <span className="font-mono text-fact">{key.join(', ')}</span>
        </Line>
        <Line label={OVERVIEW_LABELS.mode}>{modeText(copy.mode)}</Line>
        {source.kind === 'OPERATION' && <Line label={ORIGIN_READ}>{source.label}</Line>}
      </dl>
    </div>
  )
}

/** The panel beside the tabs: the system, how often the table is copied, the last run and the rows, and what stays in the Hub. */
export function DetailsPanel(props: {
  copy: CopySummary
  system: string
  entry: ConnectorEntry | undefined
}) {
  const { copy, system, entry } = props
  return (
    <aside
      aria-labelledby="table-details"
      className="flex min-w-0 flex-col gap-md pt-md md:w-list md:shrink-0 md:border-l md:border-line md:ps-lg"
    >
      <h2 id="table-details" className="text-label">
        {DETAILS_TITLE}
      </h2>
      <dl className="flex min-w-0 flex-col gap-md">
        <Line label={PANEL_LABELS.system}>
          <span className="flex items-center gap-sm">
            {entry !== undefined && <ConnectorLogo entry={entry} small />}
            {system}
          </span>
        </Line>
        <Line label={PANEL_LABELS.frequency}>{frequencyText(copy.interval)}</Line>
        <Line label={PANEL_LABELS.lastRun}>{lastRunText(copy.run)}</Line>
        <Line label={PANEL_LABELS.rows}>{copy.rows === null ? '—' : countText(copy.rows)}</Line>
      </dl>
      <hr className="border-line" />
      <p className="text-text-2">{KEPT_IN_HUB}</p>
    </aside>
  )
}
