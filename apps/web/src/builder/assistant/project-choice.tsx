import type { CompanyId, ProjectId } from '@conexus/hub-api'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { FolderIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { projectQuery, projectsPagedQuery } from '../../hub/projects/public.ts'
import { sentenceOf } from '../../platform/hub.ts'
import { Alert } from '../../ui/alert.tsx'
import { buttonVariants } from '../../ui/button.tsx'
import { cn } from '../../ui/cn.ts'
import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover.tsx'
import { CHIP, LIST, matches, ROW, SEARCH_FROM, Search, WORDS } from './choice-list.tsx'
import type { ComposerPlace } from './plus-menu.tsx'
import { projectOf } from './plus-menu.tsx'
import {
  MORE_PROJECTS,
  NO_PROJECT_CHIP,
  NO_PROJECT_MATCH,
  NO_PROJECT_OPTION,
  PROJECT_CHOICE,
} from './text.ts'

/** The folder of a conversation with no Projeto: faded, named for a screen reader, opening nothing. */
function NoProjectChip() {
  return (
    <span
      role="img"
      aria-label={NO_PROJECT_CHIP}
      className={cn(CHIP, 'inline-flex items-center opacity-50')}
    >
      <FolderIcon aria-hidden="true" className="size-4" />
    </span>
  )
}

/** The Projeto a conversation lives in, fixed: its folder and, once the Hub has answered, its name. */
export function FixedProjectChip(props: { companyId: CompanyId; projectId: ProjectId }) {
  const project = useQuery(projectQuery(props.companyId, props.projectId)).data?.project
  return (
    <span className={cn(CHIP, 'inline-flex items-center')}>
      <FolderIcon aria-hidden="true" className="size-4 shrink-0" />
      {project !== undefined && (
        <span className={cn('max-w-40 truncate', WORDS)}>{project.name}</span>
      )}
    </span>
  )
}

/** Início's choice of the Projeto a conversation is born in, only until its first question: "Sem Projeto" and the Projetos, with a search from `SEARCH_FROM`. */
function ProjectChoice(props: {
  companyId: CompanyId
  value: ProjectId | undefined
  onChange: (projectId: ProjectId | undefined) => void
}) {
  const read = useInfiniteQuery(projectsPagedQuery(props.companyId))
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const projects = read.data?.pages.flatMap((page) => page.projects) ?? []
  const shown = projects.filter((project) => matches(project.name, query))
  const chosen = projects.find((project) => project.id === props.value)
  function pick(projectId: ProjectId | undefined) {
    props.onChange(projectId)
    setOpen(false)
  }
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label={PROJECT_CHOICE}
        className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), CHIP)}
      >
        <FolderIcon aria-hidden="true" className="size-4 shrink-0" />
        {chosen !== undefined && (
          <span className={cn('max-w-40 truncate text-text', WORDS)}>{chosen.name}</span>
        )}
      </PopoverTrigger>
      <PopoverContent side="top" align="start" aria-label={PROJECT_CHOICE} className="gap-xs p-xs">
        {projects.length >= SEARCH_FROM && (
          <Search label="Buscar Projeto" value={query} onChange={setQuery} />
        )}
        <div className={LIST}>
          {query === '' && (
            <ProjectRow checked={props.value === undefined} onPick={() => pick(undefined)}>
              {NO_PROJECT_OPTION}
            </ProjectRow>
          )}
          {shown.map((project) => (
            <ProjectRow
              key={project.id}
              checked={project.id === props.value}
              onPick={() => pick(project.id)}
            >
              <span className="truncate">{project.name}</span>
            </ProjectRow>
          ))}
          {query !== '' && shown.length === 0 && (
            <p className="px-sm py-xs text-text-2">{NO_PROJECT_MATCH}</p>
          )}
        </div>
        {read.hasNextPage && (
          <button
            type="button"
            className={ROW}
            disabled={read.isFetchingNextPage}
            onClick={() => void read.fetchNextPage()}
          >
            {MORE_PROJECTS}
          </button>
        )}
        {read.isError && (
          <Alert tone="danger" className="px-sm py-xs">
            {sentenceOf(read.error)}
          </Alert>
        )}
      </PopoverContent>
    </Popover>
  )
}

function ProjectRow(props: { checked: boolean; onPick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={props.checked}
      className={cn(ROW, props.checked && 'bg-surface-3')}
      onClick={props.onPick}
    >
      {props.children}
    </button>
  )
}

/** The folder of the box's row: chosen at Início, fixed in a Projeto's conversation, faded without one. */
export function ProjectControl({ place }: { place: ComposerPlace }) {
  const projectId = projectOf(place)
  if (place.kind === 'HOME' && place.onProject !== undefined)
    return (
      <ProjectChoice companyId={place.companyId} value={projectId} onChange={place.onProject} />
    )
  return projectId === undefined ? (
    <NoProjectChip />
  ) : (
    <FixedProjectChip companyId={place.companyId} projectId={projectId} />
  )
}
