import type { CompanyId, ProjectId } from '@conexus/hub-api'
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
  { name: 'Versão', width: 'w-14 lg:w-20' },
  { name: 'Ações', width: 'w-24 lg:w-28' },
]

/**
 * The tab **Ferramentas** of the area (step 24.3.1, U7, criterion 32): the tools of the company's
 * library the Projeto may use as a table (prototype screen 4), read from `listTools` alone.
 */
export function ToolsTab(scope: Scope) {
  const read = useQuery(toolsQuery(scope))
  return (
    <AreaFrame scope={scope} tab="ferramentas">
      {read.isPending && <Skeleton className="h-20 w-full" />}
      {read.isError && (
        <ReadFailure text={sentenceOf(read.error)} onRetry={() => void read.refetch()} />
      )}
      {read.data?.tools.length === 0 && <p className="text-text-2">{NO_TOOLS_YET}</p>}
      {read.data !== undefined && read.data.tools.length > 0 && (
        <FramedTable aria-label="Ferramentas" columns={COLUMNS}>
          <TableBody>
            {read.data.tools.map((tool) => (
              <ToolRow key={tool.id} scope={scope} tool={tool} />
            ))}
          </TableBody>
        </FramedTable>
      )}
    </AreaFrame>
  )
}
