import type { AppCell, AppTableName, CompanyId, ProjectId } from '@conexus/hub-api'
import { FAILURES } from '@conexus/hub-api'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { HubFailure, sentenceOf } from '../../platform/hub.ts'
import { Alert } from '../../ui/alert.tsx'
import { SectionTitle } from '../../ui/list.tsx'
import { Pager } from '../../ui/pager.tsx'
import { Empty, RouteReadFailure } from '../../ui/states.tsx'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table.tsx'
import { useIsMobile } from '../../ui/use-mobile.ts'
import { appRowsQuery } from './queries.ts'

const NO_ROWS = 'Esta tabela ainda não tem linhas.'

/** One cell: the text the database wrote, with "…" when it was cut, or a faint dash that a reader hears as "sem valor". */
function Cell({ cell }: { cell: AppCell }) {
  if (cell === null) {
    return (
      <span role="img" aria-label="sem valor" className="text-text-2">
        —
      </span>
    )
  }
  return <span className="font-mono text-fact">{cell.cut ? `${cell.text}…` : cell.text}</span>
}

/** The rows of one table, a page at a time, the page in the address; the table has its own box to scroll sideways. */
export function DataRows(props: {
  companyId: CompanyId
  projectId: ProjectId
  table: AppTableName
  page: string | undefined
}) {
  const { companyId, projectId, table, page } = props
  const { data } = useSuspenseQuery(appRowsQuery(companyId, projectId, table, page))
  const phone = useIsMobile()
  // A page's rows and cells have no id of their own: their place in the page is.
  const lines = data.rows.map((row, at) => ({
    at,
    cells: row.map((value, column) => ({ at: column, value })),
  }))
  return (
    <section aria-label={table} className="flex min-w-0 flex-col gap-md">
      {phone && (
        <Link
          to="/companies/$companyId/projects/$projectId/data"
          params={{ companyId, projectId }}
          className="text-label"
        >
          ‹ Tabelas
        </Link>
      )}
      <SectionTitle>{table}</SectionTitle>
      <Table>
        <TableHeader>
          <TableRow>
            {data.columns.map((column) => (
              <TableHead key={column.name}>{column.name}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {lines.map((line) => (
            <TableRow key={line.at}>
              {line.cells.map((cell) => (
                <TableCell key={cell.at}>
                  <Cell cell={cell.value} />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {data.rows.length === 0 && <Empty>{NO_ROWS}</Empty>}
      <Pager next={data.next} param="page" page={page} list={table} />
    </section>
  )
}

/** A table's read that failed: the sentence, and "Tentar de novo" unless the failure has nothing to retry (a table too wide). */
export function RowsFailure({ error, reset }: { error: unknown; reset: () => void }) {
  if (error instanceof HubFailure && FAILURES[error.code].actionKind === 'NONE') {
    return <Alert tone="danger">{sentenceOf(error)}</Alert>
  }
  return <RouteReadFailure error={error} reset={reset} />
}
