import type { AppTableSummary, AppTables, CompanyId, ProjectId, RowCount } from '@conexus/hub-api'
import { ROW_COUNT_CAP } from '@conexus/hub-api'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Link, useParams } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { List, PageTitle, Row } from '../../ui/list.tsx'
import { SidebarMenuButton } from '../../ui/sidebar.tsx'
import { Empty } from '../../ui/states.tsx'
import { Tooltip, TooltipContent, TooltipTrigger } from '../../ui/tooltip.tsx'
import { useIsMobile } from '../../ui/use-mobile.ts'
import { appTablesQuery } from './queries.ts'

const NO_APP = 'Este Projeto ainda não tem app. Peça um ao Conexus em Construir.'
const NO_TABLES = 'O app ainda não criou tabelas.'

const CAP_NOTE = 'teto da contagem'
const TABLES_HEADING = 'data-Tabelas-do-app'

/** What the list says a table holds: the count in the person's language, "mais de 10.000" (its ceiling is said in `CountCell`), or that it could not be counted. */
export function countText(rows: RowCount): string {
  switch (rows.kind) {
    case 'EXACT':
      return rows.rows.toLocaleString('pt-BR')
    case 'OVER':
      return `mais de ${ROW_COUNT_CAP.toLocaleString('pt-BR')}`
    case 'UNKNOWN':
      return 'indisponível'
    default:
      return rows satisfies never
  }
}

/** The count beside a table's name; past the ceiling, a tooltip and a screen-reader-only note say it is the count's ceiling, so the name keeps its room. */
function CountCell({ rows }: { rows: RowCount }) {
  const className = 'shrink-0 text-fact tabular-nums text-text-2'
  if (rows.kind !== 'OVER') return <span className={className}>{countText(rows)}</span>
  return (
    <Tooltip>
      <TooltipTrigger render={<span className={className} />}>
        {countText(rows)}
        <span className="sr-only"> ({CAP_NOTE})</span>
      </TooltipTrigger>
      <TooltipContent>{CAP_NOTE}</TooltipContent>
    </Tooltip>
  )
}

/** One table of the list: a link to its rows, with its count beside it. */
function TableLink(props: { companyId: CompanyId; projectId: ProjectId; table: AppTableSummary }) {
  const { companyId, projectId, table } = props
  return (
    <Row>
      <SidebarMenuButton
        className="h-auto min-h-row justify-between gap-md py-xs pointer-coarse:h-auto"
        render={
          <Link
            to="/companies/$companyId/projects/$projectId/data/$table"
            params={{ companyId, projectId, table: table.name }}
          />
        }
      >
        <span className="min-w-0 break-all">{table.name}</span>
        <CountCell rows={table.rows} />
      </SidebarMenuButton>
    </Row>
  )
}

/** What the page lists of a Projeto: the tables the app keeps, or why it has none. */
function listOf(data: AppTables) {
  if (data.kind === 'NO_APP') return { tables: [], noTables: NO_APP }
  return { tables: data.tables, noTables: NO_TABLES }
}

/**
 * The Dados page of a Projeto's app: the tables with their row counts, and a table's rows beside
 * them in `children`, the child route. On a phone one of the two shows at a time: the list, or the
 * rows of the table the address names.
 */
export function DataPage({
  companyId,
  projectId,
  children,
}: {
  companyId: CompanyId
  projectId: ProjectId
  children: ReactNode
}) {
  const { data } = useSuspenseQuery(appTablesQuery(companyId, projectId))
  const phone = useIsMobile()
  const open = useParams({ strict: false, select: (params) => params.table })
  const rowsOnly = phone && open !== undefined
  const { tables, noTables } = listOf(data)
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-lg overflow-y-auto p-xl">
      {!rowsOnly && <PageTitle>Dados</PageTitle>}
      {tables.length === 0 && <Empty>{noTables}</Empty>}
      {tables.length > 0 && (
        <div className="flex min-h-0 flex-1 flex-col gap-xl md:flex-row">
          {!rowsOnly && (
            <nav aria-label="Tabelas" className="flex flex-col gap-lg md:w-64 md:shrink-0">
              <section aria-labelledby={TABLES_HEADING} className="flex flex-col gap-sm">
                <h2 id={TABLES_HEADING} className="text-eyebrow text-text-2">
                  Tabelas do app
                </h2>
                <List>
                  {tables.map((table) => (
                    <TableLink
                      key={table.name}
                      table={table}
                      companyId={companyId}
                      projectId={projectId}
                    />
                  ))}
                </List>
              </section>
            </nav>
          )}
          <div className="flex min-w-0 flex-1 flex-col gap-md">{children}</div>
        </div>
      )}
    </div>
  )
}
