import type { CompanyId, ProjectId } from '@conexus/hub-api'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { FilterIcon, XIcon } from 'lucide-react'
import { ProjectPicker, projectQuery } from '../../hub/projects/public.ts'
import { Button, touchArea } from '../../ui/button.tsx'
import type { Place } from './list-view.ts'
import {
  ALL_PLACES,
  AUTOMATIONS_PLACE,
  CLEAR_FILTER,
  FILTER_CONVERSATIONS,
  HOME_PLACE,
  PROJECT_FALLBACK,
} from './text.ts'

const ALL = 'ALL'

/** Puts the place in the address, or takes it out; the page goes with it, since the list is another. */
function usePlace() {
  const navigate = useNavigate()
  return (place: Place | undefined) =>
    navigate({
      to: '.',
      search: (old) => ({ ...old, place, conversations: undefined }),
      replace: true,
    })
}

/** The filter's icon and its list: Todas, Início, each Projeto, Automações. */
export function PlaceFilter(props: { companyId: CompanyId; place: Place | undefined }) {
  const choose = usePlace()
  return (
    <ProjectPicker<typeof ALL | 'HOME' | 'AUTOMATIONS'>
      companyId={props.companyId}
      label={FILTER_CONVERSATIONS}
      trigger={() => (
        <Button variant="ghost" size="icon-sm">
          <FilterIcon aria-hidden="true" />
        </Button>
      )}
      value={props.place ?? ALL}
      onPick={(value) => void choose(value === ALL ? undefined : value)}
      before={[
        { value: ALL, label: ALL_PLACES },
        { value: 'HOME', label: HOME_PLACE },
      ]}
      after={[{ value: 'AUTOMATIONS', label: AUTOMATIONS_PLACE }]}
      recentFor={undefined}
    />
  )
}

/** The place chosen, as a label with "×" to take it out. */
export function PlaceLabel(props: { companyId: CompanyId; place: Place }) {
  const { companyId, place } = props
  if (place === 'HOME') return <Chosen name={HOME_PLACE} />
  if (place === 'AUTOMATIONS') return <Chosen name={AUTOMATIONS_PLACE} />
  return <ProjectPlace companyId={companyId} projectId={place} />
}

/** A Projeto's name, read on its own: the filter's pages may not hold it; "Projeto" if the read fails. */
function ProjectPlace(props: { companyId: CompanyId; projectId: ProjectId }) {
  const read = useQuery(projectQuery(props.companyId, props.projectId))
  if (read.isPending) return null
  return <Chosen name={read.isError ? PROJECT_FALLBACK : read.data.project.name} />
}

function Chosen({ name }: { name: string }) {
  const choose = usePlace()
  return (
    <span className="mb-xs inline-flex min-h-8 w-fit items-center gap-xs rounded-pill border border-line pl-sm text-fact text-text-2">
      {name}
      <button
        type="button"
        aria-label={`${CLEAR_FILTER}: ${name}`}
        className={`${touchArea} inline-flex size-8 items-center justify-center`}
        onClick={() => void choose(undefined)}
      >
        <XIcon aria-hidden="true" className="size-3" />
      </button>
    </span>
  )
}
