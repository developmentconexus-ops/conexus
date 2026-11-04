import type { CompanyId } from '@conexus/hub-api'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { FilterIcon, XIcon } from 'lucide-react'
import { projectsQuery } from '../../hub/projects/public.ts'
import { Button, touchArea } from '../../ui/button.tsx'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '../../ui/dropdown-menu.tsx'
import type { Place } from './list-view.ts'
import { viewOf } from './list-view.ts'
import {
  ALL_PLACES,
  AUTOMATIONS_PLACE,
  CLEAR_FILTER,
  FILTER_CONVERSATIONS,
  HOME_PLACE,
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
      state: { keepDrawer: true },
    })
}

function placeName(place: Place, projects: { id: string; name: string }[]) {
  if (place === 'HOME') return HOME_PLACE
  if (place === 'AUTOMATIONS') return AUTOMATIONS_PLACE
  return projects.find((each) => each.id === place)?.name ?? place
}

/** The filter's icon and its menu: Todas, Início, each Projeto, Automações. */
export function PlaceFilter(props: { companyId: CompanyId; place: Place | undefined }) {
  const projects = useQuery(projectsQuery(props.companyId, undefined))
  const choose = usePlace()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label={FILTER_CONVERSATIONS}
            className="size-6"
          />
        }
      >
        <FilterIcon aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuRadioGroup
          value={props.place ?? ALL}
          onValueChange={(value) => {
            void choose(viewOf({ place: value }).place)
          }}
        >
          <DropdownMenuRadioItem value={ALL} closeOnClick>
            {ALL_PLACES}
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="HOME" closeOnClick>
            {HOME_PLACE}
          </DropdownMenuRadioItem>
          {projects.data?.projects.map((project) => (
            <DropdownMenuRadioItem key={project.id} value={project.id} closeOnClick>
              {project.name}
            </DropdownMenuRadioItem>
          ))}
          <DropdownMenuRadioItem value="AUTOMATIONS" closeOnClick>
            {AUTOMATIONS_PLACE}
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** The place chosen, as a label with "×" to take it out. */
export function PlaceLabel(props: { companyId: CompanyId; place: Place }) {
  const projects = useQuery(projectsQuery(props.companyId, undefined))
  const choose = usePlace()
  const name = placeName(props.place, projects.data?.projects ?? [])
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
