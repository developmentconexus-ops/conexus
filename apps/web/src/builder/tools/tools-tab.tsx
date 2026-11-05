import type { CompanyId, ProjectId, ToolSummary } from '@conexus/hub-api'
import type { UseQueryResult } from '@tanstack/react-query'
import { useQuery } from '@tanstack/react-query'
import { sentenceOf } from '../../platform/hub.ts'
import { Skeleton } from '../../ui/skeleton.tsx'
import { ReadFailure } from '../../ui/states.tsx'
import { FramedTable, TableBody } from '../../ui/table.tsx'
import { AreaFrame, toolsQuery } from '../agents/public.ts'
import { NO_TOOLS_YET } from './text.ts'
import { ToolRow } from './tool-row.tsx'

type Scope = { companyId: CompanyId; projectId: ProjectId }

const COLUMNS = [
  { name: 'Ferramenta' },
  { name: 'Lê de', leavesOnPhone: true, width: 'lg:w-48' },
  { name: 'Efeito', leavesOnPhone: true, width: 'lg:w-28' },
  { name: 'Usada por', leavesOnPhone: true, width: 'lg:w-64' },
  { name: 'Versão', leavesOnPhone: true, width: 'lg:w-20' },
  { name: 'Ações', leavesOnPhone: true, width: 'lg:w-52' },
]

/**
 * The tab **Ferramentas** of the area (step 24.3.1, U7, criterion 32): the tools of the company's
 * library the Projeto may use as a table (prototype screen 4), read from `listTools` alone.
 */
export function ToolsTab(scope: Scope) {
  const read = useQuery(toolsQuery(scope))
  return (
    <AreaFrame scope={scope} tab="ferramentas">
      <Library scope={scope} read={read} />
    </AreaFrame>
  )
}

/** What the tab shows for the read: the failure, the wait, the empty sentence or the table. */
function Library(props: { scope: Scope; read: UseQueryResult<{ tools: ToolSummary[] }> }) {
  const { read } = props
  if (read.isError) {
    return <ReadFailure text={sentenceOf(read.error)} onRetry={() => void read.refetch()} />
  }
  if (read.isPending) return <Skeleton className="h-20 w-full" />
  if (read.data.tools.length === 0) return <p className="text-text-2">{NO_TOOLS_YET}</p>
  return (
    <FramedTable aria-label="Ferramentas" columns={COLUMNS} showHeader>
      <TableBody>
        {read.data.tools.map((tool) => (
          <ToolRow key={tool.id} scope={props.scope} tool={tool} />
        ))}
      </TableBody>
    </FramedTable>
  )
}
