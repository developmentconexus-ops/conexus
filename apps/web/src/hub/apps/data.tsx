import type { AppTableSummary, AppTables, CompanyId, ProjectId, RowCount } from '@conexus/hub-api'
import { ROW_COUNT_CAP } from '@conexus/hub-api'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Link, useParams } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { List, PageTitle, Row } from '../../ui/list.tsx'
import { SidebarMenuButton } from '../../ui/sidebar.tsx'
import { Empty } from '../../ui/states.tsx'
import { useIsMobile } from '../../ui/use-mobile.ts'
import { appTablesQuery } from './queries.ts'

const NO_APP = 'Este Projeto ainda não tem app. Peça um ao Builder.'
const NO_TABLES = 'O app ainda não criou tabelas.'

/** What the list says a table holds: the count in the person's language, "mais de 10.000", or that it could not be counted. */
function countText(rows: RowCount): string {
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

/** One table of the list: a link to its rows, by the route of its schema, with its count beside it. */
function TableLink(props: { companyId: CompanyId; projectId: ProjectId; table: AppTableSummary }) {
  const { companyId, projectId, table } = props
  const params = { companyId, projectId, table: table.name }
  return (
    <Row>
      <SidebarMenuButton
        className="justify-between gap-md"
        render={
          table.schema === 'COPY' ? (
            <Link
              to="/companies/$companyId/projects/$projectId/data/copies/$table"
              params={params}
            />
          ) : (
            <Link to="/companies/$companyId/projects/$projectId/data/$table" params={params} />
          )
        }
      >
        <span className="min-w-0 truncate">{table.name}</span>
        <span className="shrink-0 text-fact tabular-nums text-text-2">{countText(table.rows)}</span>
      </SidebarMenuButton>
    </Row>
  )
}

/** A titled group of the list: the app's tables, or the copies released to the Projeto. */
function TableGroup(props: {
  title: string
  empty?: string
  companyId: CompanyId
  projectId: ProjectId
  tables: readonly AppTableSummary[]
}) {
  const { title, empty, tables, ...ids } = props
  const heading = `data-${props.title.replaceAll(' ', '-')}`
  return (
    <section aria-labelledby={heading} className="flex flex-col gap-sm">
      <h2 id={heading} className="text-eyebrow text-text-2">
        {title}
      </h2>
      {tables.length === 0 ? (
        empty !== undefined && <Empty>{empty}</Empty>
      ) : (
        <List>
          {tables.map((table) => (
            <TableLink key={`${table.schema}:${table.name}`} table={table} {...ids} />
          ))}
        </List>
      )}
    </section>
  )
}

/** What the page lists of a Projeto: the app's tables (or why it has none) and the copies released to it. */
function listOf(data: AppTables) {
  const [tables, copies] =
    data.kind === 'NO_APP'
      ? [[], data.copies]
      : [
          data.tables.filter((table) => table.schema === 'APP'),
          data.tables.filter((table) => table.schema === 'COPY'),
        ]
  return { tables, copies, noTables: data.kind === 'NO_APP' ? NO_APP : NO_TABLES }
}

/**
 * The Dados page of a Projeto's app: the tables with their row counts, then the copies released to
 * the Projeto, and a table's rows beside them in `children`, the child route. On a phone one of the
 * two shows at a time: the list, or the rows of the table the address names.
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
  const { tables, copies, noTables } = listOf(data)
  const nothing = tables.length === 0 && copies.length === 0
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-lg overflow-y-auto p-xl">
      {!rowsOnly && <PageTitle>Dados</PageTitle>}
      {nothing && <Empty>{noTables}</Empty>}
      {!nothing && (
        <div className="flex min-h-0 flex-1 flex-col gap-xl md:flex-row">
          {!rowsOnly && (
            <nav aria-label="Tabelas" className="flex flex-col gap-lg md:w-64 md:shrink-0">
              <TableGroup
                title="Tabelas do app"
                empty={noTables}
                tables={tables}
                {...{ companyId, projectId }}
              />
              {copies.length > 0 && (
                <TableGroup
                  title="Cópias liberadas"
                  tables={copies}
                  {...{ companyId, projectId }}
                />
              )}
            </nav>
          )}
          <div className="flex min-w-0 flex-1 flex-col gap-md">{children}</div>
        </div>
      )}
    </div>
  )
}
