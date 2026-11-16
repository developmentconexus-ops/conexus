import type { CompanyId, CopyId, CopySummary } from '@conexus/hub-api'
import { useQuery } from '@tanstack/react-query'
import { HubFailure, sentenceOf } from '../../platform/hub.ts'
import { Alert } from '../../ui/alert.tsx'
import { Skeleton } from '../../ui/skeleton.tsx'
import { ReadFailure } from '../../ui/states.tsx'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table.tsx'
import { ColumnTypeIcon } from './column-type.tsx'
import { copySampleQuery } from './queries.ts'
import { ROW_NUMBER, SAMPLE_EMPTY, SAMPLE_INTRO, SAMPLE_MORE } from './text.ts'

/** A value of a sample as the cell shows it: a missing one as a dash, a structure as its JSON. */
function cellText(value: unknown): string {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return JSON.stringify(value)
}

/** The **Amostra** tab: the first rows of the copy's table, read when the tab opens, for whoever may read rows. */
export function CopySample(props: {
  companyId: CompanyId
  copyId: CopyId
  columns: CopySummary['shown']['columns']
}) {
  const { companyId, copyId } = props
  const types = new Map(props.columns.map((one) => [one.name, one.type]))
  const read = useQuery(copySampleQuery(companyId, copyId))
  if (read.isPending) return <Skeleton className="h-24 w-full" />
  if (read.isError) {
    if (read.error instanceof HubFailure && read.error.code === 'COPY_NOT_IN_ROLE') {
      return <Alert tone="danger">{sentenceOf(read.error)}</Alert>
    }
    return <ReadFailure text={sentenceOf(read.error)} onRetry={() => void read.refetch()} />
  }
  const { columns, rows, complete } = read.data.sample
  if (rows.length === 0) return <p className="text-text-2">{SAMPLE_EMPTY}</p>
  return (
    <div className="flex min-w-0 flex-col gap-md">
      <p className="text-text-2">{SAMPLE_INTRO}</p>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8">
              <span className="sr-only">{ROW_NUMBER}</span>
            </TableHead>
            {columns.map((column) => (
              <TableHead key={column}>
                <span className="inline-flex items-center gap-xs">
                  <ColumnTypeIcon type={types.get(column)} />
                  <span className="font-mono text-fact">{column}</span>
                </span>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, at) => (
            <TableRow key={rowKey(row, at)}>
              <TableCell className="text-text-2 tabular-nums">{at + 1}</TableCell>
              {columns.map((column, index) => (
                <TableCell key={column} className="whitespace-normal break-words tabular-nums">
                  {cellText(row[index])}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {!complete && <p className="text-text-2">{SAMPLE_MORE}</p>}
    </div>
  )
}

function rowKey(row: readonly unknown[], at: number): string {
  return `${at}:${row.map(cellText).join('|')}`
}
