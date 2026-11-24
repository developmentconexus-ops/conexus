import type { CompanyId, ProjectId } from '@conexus/hub-api'
import { useQuery } from '@tanstack/react-query'
import { FolderIcon } from 'lucide-react'
import { ProjectPicker, projectQuery } from '../../hub/projects/public.ts'
import { buttonVariants } from '../../ui/button.tsx'
import { cn } from '../../ui/cn.ts'
import { CHIP, WORDS } from './choice-list.tsx'
import type { ComposerPlace } from './plus-menu.tsx'
import { projectOf } from './plus-menu.tsx'
import {
  NO_PROJECT_CHIP,
  NO_PROJECT_OPTION,
  PROJECT_CHOICE,
  PROJECT_FALLBACK,
  PROJECT_MENU_TITLE,
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

/** The Projeto a conversation lives in, fixed: its folder and, once the Hub has answered, its name; "Projeto" if the read fails. */
function FixedProjectChip(props: { companyId: CompanyId; projectId: ProjectId }) {
  const read = useQuery(projectQuery(props.companyId, props.projectId))
  const name = read.isError ? PROJECT_FALLBACK : read.data?.project.name
  return (
    <span className={cn(CHIP, 'inline-flex items-center')}>
      <FolderIcon aria-hidden="true" className="size-4 shrink-0" />
      {name !== undefined && <span className={cn('max-w-40 truncate', WORDS)}>{name}</span>}
    </span>
  )
}

const NONE = 'NONE'

/** Início's choice of the Projeto a conversation is born in, only until its first question: "Sem Projeto" and the Projetos. */
function ProjectChoice(props: {
  companyId: CompanyId
  value: ProjectId | undefined
  onChange: (projectId: ProjectId | undefined) => void
}) {
  return (
    <ProjectPicker<typeof NONE>
      companyId={props.companyId}
      label={PROJECT_CHOICE}
      title={PROJECT_MENU_TITLE}
      trigger={(chosen) => (
        <button
          type="button"
          className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), CHIP)}
        >
          <FolderIcon aria-hidden="true" className="size-4 shrink-0" />
          {chosen !== undefined && chosen.value !== NONE && (
            <span className={cn('max-w-40 truncate text-text', WORDS)}>{chosen.label}</span>
          )}
        </button>
      )}
      value={props.value ?? NONE}
      onPick={(value) => props.onChange(value === NONE ? undefined : value)}
      before={[{ value: NONE, label: NO_PROJECT_OPTION }]}
      after={[]}
      recentFor={undefined}
    />
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
