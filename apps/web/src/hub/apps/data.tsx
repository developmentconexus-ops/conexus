import type { CompanyId, ProjectId, RowCount } from '@conexus/hub-api'
import { ROW_COUNT_CAP } from '@conexus/hub-api'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Link, useParams } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { List, PageTitle, Row, rowBody } from '../../ui/list.tsx'
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
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-lg overflow-y-auto p-xl">
      {!rowsOnly && <PageTitle>Dados</PageTitle>}
      {data.kind === 'NO_APP' && <Empty>{NO_APP}</Empty>}
      {data.kind === 'TABLES' && data.tables.length === 0 && <Empty>{NO_TABLES}</Empty>}
      {data.kind === 'TABLES' && data.tables.length > 0 && (
        <div className="flex min-h-0 flex-1 flex-col gap-xl md:flex-row">
          {!rowsOnly && (
            <nav aria-label="Tabelas" className="flex flex-col gap-sm md:w-64 md:shrink-0">
              <h2 className="text-eyebrow text-text-2">Tabelas</h2>
              <List>
                {data.tables.map((table) => (
                  <Row key={table.name}>
                    <Link
                      to="/companies/$companyId/projects/$projectId/data/$table"
                      params={{ companyId, projectId, table: table.name }}
                      className={`${rowBody({ kind: 'link' })} aria-[current=page]:bg-surface-3 aria-[current=page]:font-medium`}
                    >
                      <span className="min-w-0 truncate">{table.name}</span>
                      <span className="shrink-0 text-fact tabular-nums text-text-2">
                        {countText(table.rows)}
                      </span>
                    </Link>
                  </Row>
                ))}
              </List>
            </nav>
          )}
          <div className="flex min-w-0 flex-1 flex-col gap-md">{children}</div>
        </div>
      )}
    </div>
  )
}
