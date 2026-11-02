import type { CompanyId } from '@conexus/hub-api'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { sentenceOf } from '../../platform/hub.ts'
import { BLOCK_ROWS, Block, BlockSentence, blockRow, Stamp } from '../../ui/block.tsx'
import { Skeleton } from '../../ui/skeleton.tsx'
import { ReadFailure } from '../../ui/states.tsx'
import { projectStateOf, projectStateText } from './project-state.ts'
import { projectsQuery } from './queries.ts'

const NO_PROJECTS = 'Nenhum projeto ainda.'

function ProjectRows({ companyId }: { companyId: CompanyId }) {
  const read = useQuery(projectsQuery(companyId, undefined))
  if (read.isPending) return <Skeleton className="h-24 w-full" />
  if (read.isError)
    return <ReadFailure text={sentenceOf(read.error)} onRetry={() => void read.refetch()} />
  const { projects } = read.data
  if (projects.length === 0) return <BlockSentence>{NO_PROJECTS}</BlockSentence>
  const hidden = projects.length - BLOCK_ROWS
  return (
    <ul>
      {projects.slice(0, BLOCK_ROWS).map((project) => {
        const state = projectStateOf(project)
        return (
          <li key={project.id}>
            <Link
              to="/companies/$companyId/projects/$projectId"
              params={{ companyId, projectId: project.id }}
              className={`${blockRow} hover:bg-surface-3`}
            >
              <span className="min-w-0 flex-1 truncate">{project.name}</span>
              <Stamp tone={state.kind === 'PUBLISHED' ? 'success' : 'neutral'}>
                {projectStateText(state)}
              </Stamp>
            </Link>
          </li>
        )
      })}
      {hidden > 0 && (
        <li>
          <Link
            to="/companies/$companyId/projects"
            params={{ companyId }}
            className={`${blockRow} text-text-2 hover:bg-surface-3`}
          >
            Mais {hidden}
          </Link>
        </li>
      )}
    </ul>
  )
}

/** "Projetos" on Início: the first five, each with its app's state in words (step 13.3, U3). */
export function ProjectsBlock({ companyId }: { companyId: CompanyId }) {
  return (
    <Block
      title="Projetos"
      action={
        <Link
          to="/companies/$companyId/projects"
          params={{ companyId }}
          className="text-label text-text-2 hover:text-text"
        >
          Todos →
        </Link>
      }
    >
      <ProjectRows companyId={companyId} />
    </Block>
  )
}
