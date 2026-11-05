import type { CompanyId } from '@conexus/hub-api'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { sentenceOf } from '../../platform/hub.ts'
import { BLOCK_ROWS, Block, BlockSentence, blockRow, Stamp } from '../../ui/block.tsx'
import { Skeleton } from '../../ui/skeleton.tsx'
import { ReadFailure } from '../../ui/states.tsx'
import { NewProjectDialog } from './new-project-dialog.tsx'
import { NO_PROJECTS, projectStateOf, projectStateText, projectStateTone } from './project-state.ts'
import { projectsQuery } from './queries.ts'

function ProjectRows({ companyId }: { companyId: CompanyId }) {
  const read = useQuery(projectsQuery(companyId, undefined))
  if (read.isPending) return <Skeleton className="h-24 w-full" />
  if (read.isError)
    return <ReadFailure text={sentenceOf(read.error)} onRetry={() => void read.refetch()} />
  const { projects, next } = read.data
  if (projects.length === 0) return <BlockSentence>{NO_PROJECTS}</BlockSentence>
  // The page holds 50 at most: past it the count is unknown, so the row says "Mais" alone.
  const hidden = projects.length - BLOCK_ROWS
  const more = next.kind === 'MORE' ? 'Mais' : `Mais ${hidden}`
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
              <Stamp tone={projectStateTone(state)}>{projectStateText(state)}</Stamp>
            </Link>
          </li>
        )
      })}
      {(hidden > 0 || next.kind === 'MORE') && (
        <li>
          <Link
            to="/companies/$companyId/projects"
            params={{ companyId }}
            className={`${blockRow} text-text-2 hover:bg-surface-3`}
          >
            {more}
          </Link>
        </li>
      )}
    </ul>
  )
}

/**
 * "Projetos" on Início: the first five, each with its app's state in words (step 13.3, U3). Where
 * the list holds no "+" (the owner's and the administrator's), `creates` brings "Novo projeto" here.
 */
export function ProjectsBlock(props: { companyId: CompanyId; creates?: boolean }) {
  const { companyId } = props
  return (
    <Block
      title="Projetos"
      action={
        <span className="flex items-center gap-md">
          {props.creates && <NewProjectDialog companyId={companyId} />}
          <Link
            to="/companies/$companyId/projects"
            params={{ companyId }}
            className="text-label text-text-2 hover:text-text"
          >
            Todos →
          </Link>
        </span>
      }
    >
      <ProjectRows companyId={companyId} />
    </Block>
  )
}
