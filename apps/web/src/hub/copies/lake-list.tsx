import type { CompanyId, LakeTableSummary } from '@conexus/hub-api'
import { Link } from '@tanstack/react-router'
import type { FramedColumn } from '../../ui/table.tsx'
import { FramedTable, TableBody, TableCell, TableRow } from '../../ui/table.tsx'
import { useIsMobile } from '../../ui/use-mobile.ts'
import { intervalText, runFailureText } from '../connectors/public.ts'
import { endedText, RunBadge } from './lake-state.tsx'
import { LAKE_LIST_COLUMNS, NO_VALUE } from './text.ts'

const COLUMNS: FramedColumn[] = [
  { name: LAKE_LIST_COLUMNS[0] },
  { name: LAKE_LIST_COLUMNS[1], leavesOnPhone: true, width: 'lg:w-52' },
  { name: LAKE_LIST_COLUMNS[2], leavesOnPhone: true, width: 'lg:w-28' },
  { name: LAKE_LIST_COLUMNS[3], leavesOnPhone: true, width: 'lg:w-28' },
]

function rowsText(rows: number | null): string {
  return rows === null ? NO_VALUE : rows.toLocaleString('pt-BR')
}

/** The table's label first, as a link to its page; under it its name in the lake and where it came from. */
function Label(props: { companyId: CompanyId; table: LakeTableSummary; system: string }) {
  const { table, system } = props
  const phone = useIsMobile()
  const failed = table.lastRun?.outcome === 'ERROR' ? table.lastRun.code : null
  return (
    <span className="flex min-w-0 flex-col gap-xs">
      <span className="flex flex-wrap items-center gap-x-md gap-y-xs">
        <Link
          to="/companies/$companyId/data/lake/$tableId"
          params={{ companyId: props.companyId, tableId: table.id }}
          className="font-medium underline-offset-2 hover:underline"
        >
          {table.label}
        </Link>
        {phone && <RunBadge run={table.lastRun} />}
      </span>
      <span className="wrap-anywhere font-mono text-fact text-text-2">
        {table.name} · {system} · {table.source}
      </span>
      {failed !== null && <span className="text-text-2">{runFailureText(failed, system)}</span>}
      {phone && (
        <span className="text-text-2 tabular-nums">
          {endedText(table.lastRun)} · {rowsText(table.rows)} linhas
        </span>
      )}
    </span>
  )
}

function Row(props: { companyId: CompanyId; table: LakeTableSummary; system: string }) {
  const { table } = props
  const phone = useIsMobile()
  return (
    <TableRow>
      <TableCell className="whitespace-normal px-sm">
        <Label {...props} />
      </TableCell>
      {!phone && (
        <>
          <TableCell className="px-sm">
            <span className="flex flex-wrap items-center gap-sm">
              <RunBadge run={table.lastRun} />
              <span className="text-text-2 tabular-nums">{endedText(table.lastRun)}</span>
            </span>
          </TableCell>
          <TableCell className="px-sm">
            <span className="tabular-nums">{rowsText(table.rows)}</span>
          </TableCell>
          <TableCell className="px-sm">
            <span className="tabular-nums">{intervalText(table.interval)}</span>
          </TableCell>
        </>
      )}
    </TableRow>
  )
}

/** The lake's tables of one connection in Dados: the label first, the name in the lake and the origin under it. */
export function LakeList(props: {
  companyId: CompanyId
  tables: readonly LakeTableSummary[]
  system: string
  name: string
}) {
  return (
    <FramedTable aria-label={props.name} columns={COLUMNS} showHeader>
      <TableBody>
        {props.tables.map((table) => (
          <Row key={table.id} companyId={props.companyId} table={table} system={props.system} />
        ))}
      </TableBody>
    </FramedTable>
  )
}
