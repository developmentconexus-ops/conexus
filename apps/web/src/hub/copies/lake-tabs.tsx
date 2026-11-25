import type { LakeRun, LakeTableSummary } from '@conexus/hub-api'
import type { ReactNode } from 'react'
import { Empty } from '../../ui/states.tsx'
import { FramedTable, TableBody, TableCell, TableRow } from '../../ui/table.tsx'
import {
  DICTIONARY_OUT,
  intervalText,
  LINES_STAY,
  modeText,
  NAME_FIXED,
  nativeText,
  runFailureText,
  sinceOfTableText,
  WHOLE_HISTORY,
} from '../connectors/public.ts'
import { RunBadge, whenText } from './lake-state.tsx'
import {
  COLUMN_COLUMNS,
  COLUMNS_FACT,
  CONNECTION_FACT,
  columnsCountText,
  HISTORY_FACT,
  INTERVAL_FACT,
  LAKE_NAME_FACT,
  LAKE_ROWS,
  LAST_RUN,
  MANUAL_NEXT,
  MODE_FACT,
  NEXT_RUN,
  NO_HISTORY,
  NO_VALUE,
  ORIGIN_FACT,
  runKindText,
  START_FACT,
  stoppedAtText,
  systemAnswered,
  TABLE_COLUMNS,
} from './text.ts'

function Fact(props: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-xs border-b border-line py-sm sm:flex-row sm:gap-lg">
      <dt className="text-text-2 sm:w-44 sm:shrink-0">{props.label}</dt>
      <dd className="min-w-0 break-words">{props.children}</dd>
    </div>
  )
}

/** What a round that ended with an error says: the sentence of its code, where it stopped, and the system's own answer. */
export function Failed(props: { run: Extract<LakeRun, { outcome: 'ERROR' }>; system: string }) {
  const { run } = props
  return (
    <span role="alert" className="mt-xs flex flex-col gap-xs">
      <span className="text-danger">
        {run.failedTable !== null && `${stoppedAtText(run.failedTable)} `}
        {runFailureText(run.code, props.system)}
      </span>
      {run.system !== null && systemAnswered(run.code) && (
        <span className="text-text-2">{nativeText(run.system, props.system)}</span>
      )}
    </span>
  )
}

function nextText(table: LakeTableSummary): string {
  if (table.interval === 'MANUAL') return MANUAL_NEXT
  return table.next === null ? NO_VALUE : whenText(table.next)
}

export function Overview(props: { table: LakeTableSummary; system: string }) {
  const { table, system } = props
  const run = table.lastRun
  return (
    <dl className="flex flex-col">
      <Fact label={LAST_RUN}>
        {run === null ? (
          NO_VALUE
        ) : (
          <>
            <span className="flex flex-wrap items-center gap-x-md gap-y-xs">
              <RunBadge run={run} />
              {run.outcome !== 'RUNNING' && (
                <>
                  <span className="tabular-nums">{whenText(run.endedAt)}</span>
                  <span className="text-text-2">{runKindText(run)}</span>
                </>
              )}
            </span>
            {run.outcome === 'ERROR' && <Failed run={run} system={system} />}
          </>
        )}
      </Fact>
      <Fact label={LAKE_ROWS}>
        <span className="tabular-nums">{table.rows?.toLocaleString('pt-BR') ?? NO_VALUE}</span>
      </Fact>
      <Fact label={COLUMNS_FACT}>
        <span className="tabular-nums">{table.columns.length}</span>
      </Fact>
      <Fact label={NEXT_RUN}>
        <span className="tabular-nums">{nextText(table)}</span>
      </Fact>
      <Fact label={INTERVAL_FACT}>{intervalText(table.interval)}</Fact>
    </dl>
  )
}

export function Columns({ table }: { table: LakeTableSummary }) {
  if (table.columns.length === 0) return <Empty>{DICTIONARY_OUT}</Empty>
  return (
    <div className="flex flex-col gap-md">
      <p className="text-text-2 tabular-nums">{columnsCountText(table.columns.length)}</p>
      <FramedTable
        aria-label={TABLE_COLUMNS}
        columns={[
          { name: COLUMN_COLUMNS[0] },
          { name: COLUMN_COLUMNS[1], leavesOnPhone: true, width: 'lg:w-40' },
          { name: COLUMN_COLUMNS[2], leavesOnPhone: true, width: 'lg:w-80' },
        ]}
        showHeader
      >
        <TableBody>
          {table.columns.map((column) => (
            <TableRow key={column.name}>
              <TableCell className="whitespace-normal px-sm">
                <span className="flex flex-col">
                  <span className="font-mono text-fact">{column.name}</span>
                  <span className="text-text-2 md:hidden">
                    {[column.type, column.description]
                      .filter((part) => part !== null && part !== '')
                      .join(' · ')}
                  </span>
                </span>
              </TableCell>
              <TableCell className="px-sm max-md:hidden">
                <span className="text-text-2">{column.type}</span>
              </TableCell>
              <TableCell className="whitespace-normal px-sm max-md:hidden">
                <span className="text-text-2">{column.description}</span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </FramedTable>
    </div>
  )
}

export function Details(props: { table: LakeTableSummary; system: string }) {
  const { table, system } = props
  return (
    <div className="flex flex-col gap-md">
      <dl className="flex flex-col">
        <Fact label={LAKE_NAME_FACT}>
          <span className="font-mono text-fact">{table.name}</span>{' '}
          <span className="text-text-2">· {NAME_FIXED}</span>
        </Fact>
        <Fact label={ORIGIN_FACT}>
          <span className="font-mono text-fact">{table.source}</span>
          <span className="text-text-2"> · {system}</span>
        </Fact>
        <Fact label={CONNECTION_FACT}>{table.connection.name}</Fact>
        <Fact label={MODE_FACT}>{modeText(table.mode)}</Fact>
        <Fact label={START_FACT}>
          {table.startDate === null ? WHOLE_HISTORY : sinceOfTableText(table.startDate)}
        </Fact>
        <Fact label={HISTORY_FACT}>{NO_HISTORY}</Fact>
      </dl>
      <p className="text-text-2">{LINES_STAY}</p>
    </div>
  )
}
