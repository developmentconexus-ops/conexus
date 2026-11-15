import type { CopySummary } from '@conexus/hub-api'
import type { ReactNode } from 'react'
import { dayAndHour } from '../../platform/dates.ts'
import { Badge } from '../../ui/badge.tsx'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table.tsx'
import {
  COLUMN_HEADS,
  countText,
  INTERVAL_LABEL,
  inactiveMark,
  KEY_MARK,
  modeText,
  NO_DESCRIPTION,
  NO_SCHEDULE,
  ORIGIN_READ,
  OVERVIEW_LABELS,
  PANEL_LABELS,
  RAW_LAYER,
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
      <p className="max-w-message text-text-2">{description ?? NO_DESCRIPTION}</p>
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

/** The panel beside the tabs: where the table comes from and how it is kept. */
export function TablePanel(props: { copy: CopySummary; system: string }) {
  const { copy, system } = props
  const lines: [string, string][] = [
    [PANEL_LABELS.system, system],
    [PANEL_LABELS.connection, copy.sources.map((one) => one.connection.name).join(', ')],
    [PANEL_LABELS.key, copy.shown.key.join(', ')],
    [PANEL_LABELS.mode, modeText(copy.mode)],
    [PANEL_LABELS.interval, copy.interval === null ? NO_SCHEDULE : INTERVAL_LABEL[copy.interval]],
    [PANEL_LABELS.lastRun, copy.run === null ? '—' : dayAndHour(copy.run.startedAt)],
    [PANEL_LABELS.rows, copy.rows === null ? '—' : countText(copy.rows)],
    [PANEL_LABELS.layer, RAW_LAYER],
  ]
  return (
    <dl className="flex min-w-0 flex-col gap-md md:w-list md:shrink-0">
      {lines.map(([label, value]) => (
        <Line key={label} label={label}>
          {value}
        </Line>
      ))}
    </dl>
  )
}
