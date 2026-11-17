import type { CompanyId, PersonId, ProjectSummary } from '@conexus/hub-api'
import { ProjectId } from '@conexus/hub-api'
import { useInfiniteQuery, useQueries } from '@tanstack/react-query'
import type { ReactElement } from 'react'
import { useState } from 'react'
import { sentenceOf } from '../../platform/hub.ts'
import type { PickerGroup, PickerItem, PickerMore, PickerRead } from '../../ui/picker.tsx'
import { matches, Picker, SEARCH_FROM } from '../../ui/picker.tsx'
import { NO_PROJECTS } from './project-state.ts'
import { projectQuery, projectsPagedQuery } from './queries.ts'
import { useRecentProjects } from './recent-projects.tsx'
import {
  MORE_PROJECTS,
  NO_PROJECT_MATCH,
  PROJECT_FALLBACK,
  RECENT_PROJECTS,
  SEARCH_PROJECT,
} from './text.ts'

type Props<Fixed extends string> = {
  companyId: CompanyId
  label: string
  /** The question the open list shows above its rows: Em qual Projeto? */
  title?: string
  /** The place's trigger, given the item of the value so it can show its name. */
  trigger: (chosen: PickerItem<ProjectId | Fixed> | undefined) => ReactElement
  value: ProjectId | Fixed | undefined
  onPick: (value: ProjectId | Fixed) => void
  /** The place's items before the Projects: Todas, Início, Sem Projeto, Todos os Projetos. */
  before: readonly PickerItem<Fixed>[]
  /** The items after the Projects: Automações, Todos os projetos. */
  after: readonly PickerItem<Fixed>[]
  /** With a person, the Recentes group at the top (the Projeto's bar); without, none. */
  recentFor: PersonId | undefined
  /** What the list says with no item; without it, the Projetos' own sentence. */
  empty?: ReactElement
}

type Recent = readonly { id: ProjectId; name: string }[]

const NO_RECENT: Recent = []

/**
 * The company's Projects to choose one from, read a page at a time and searched in the Hub, with
 * the place's own items around them (code C44).
 */
export function ProjectPicker<Fixed extends string>(props: Props<Fixed>): ReactElement {
  return props.recentFor === undefined ? (
    <Choosing {...props} recent={NO_RECENT} />
  ) : (
    <WithRecent {...props} personId={props.recentFor} />
  )
}

function WithRecent<Fixed extends string>(props: Props<Fixed> & { personId: PersonId }) {
  const bare = useInfiniteQuery(projectsPagedQuery(props.companyId, undefined))
  const recent = useRecentProjects(
    props.companyId,
    props.personId,
    bare.isPending ? undefined : pagesOf(bare.data),
  )
  return <Choosing {...props} recent={recent} />
}

function pagesOf(data: { pages: readonly { projects: readonly ProjectSummary[] }[] } | undefined) {
  return data?.pages.flatMap((page) => page.projects) ?? []
}

function Choosing<Fixed extends string>(props: Props<Fixed> & { recent: Recent }) {
  const { companyId, before, after, value } = props
  const [text, setText] = useState('')
  const asked = text.trim() === '' ? undefined : text
  const bare = useInfiniteQuery(projectsPagedQuery(companyId, undefined))
  const read = useInfiniteQuery(projectsPagedQuery(companyId, asked))
  const known = pagesOf(bare.data)
  const projects = pagesOf(read.data)

  const recent = props.recent.filter((project) => matches(project.name, text))
  function fixed(items: readonly PickerItem<Fixed>[]) {
    return items.filter((item) => matches(item.label, text))
  }
  const groups: PickerGroup<ProjectId | Fixed>[] = [
    { label: undefined, items: fixed(before) },
    { label: RECENT_PROJECTS, items: recent.map(({ id, name }) => ({ value: id, label: name })) },
    {
      label: undefined,
      items: projects
        .filter((project) => !recent.some((one) => one.id === project.id))
        .map((project) => ({ value: project.id, label: project.name })),
    },
    { label: undefined, items: fixed(after) },
  ]

  const rows = known.length + before.length + after.length
  const searchable = asked !== undefined || rows >= SEARCH_FROM || bare.hasNextPage

  const chosen = useChosen({
    companyId,
    value,
    before,
    after,
    loaded: [...known, ...projects],
    listing: bare.isPending,
  })

  const more: PickerMore = read.hasNextPage
    ? {
        kind: 'MORE',
        loading: read.isFetchingNextPage,
        label: MORE_PROJECTS,
        onMore: () => void read.fetchNextPage(),
      }
    : { kind: 'END' }
  const state: PickerRead = read.isError
    ? { kind: 'FAILED', sentence: sentenceOf(read.error) }
    : read.isPending
      ? { kind: 'LOADING' }
      : { kind: 'READY' }

  return (
    <Picker
      label={props.label}
      title={props.title}
      trigger={props.trigger(chosen)}
      groups={groups}
      value={value}
      chosen={chosen}
      onPick={props.onPick}
      more={more}
      read={state}
      search={searchable ? { text, onText: setText } : undefined}
      searchLabel={SEARCH_PROJECT}
      noMatch={NO_PROJECT_MATCH}
      empty={props.empty ?? <span>{NO_PROJECTS}</span>}
    />
  )
}

/** The item of the value: a fixed one, one of the pages read or, outside them, the name `projectQuery` reads. */
function useChosen<Fixed extends string>(input: {
  companyId: CompanyId
  value: ProjectId | Fixed | undefined
  before: readonly PickerItem<Fixed>[]
  after: readonly PickerItem<Fixed>[]
  loaded: readonly ProjectSummary[]
  /** The first page is still on its way: the value may be in it, so its name is not read yet. */
  listing: boolean
}): PickerItem<ProjectId | Fixed> | undefined {
  const { companyId, value, loaded } = input
  const fixed = [...input.before, ...input.after].find((item) => item.value === value)
  const id = fixed === undefined ? ProjectId.safeParse(value) : undefined
  const listed = id?.success ? loaded.find((project) => project.id === id.data) : undefined
  const outside = id?.success && listed === undefined && !input.listing ? [id.data] : []
  const [named] = useQueries({ queries: outside.map((one) => projectQuery(companyId, one)) })
  if (fixed !== undefined) return fixed
  if (listed !== undefined) return { value: listed.id, label: listed.name }
  if (named === undefined || !id?.success || named.isPending) return undefined
  return { value: id.data, label: named.isSuccess ? named.data.project.name : PROJECT_FALLBACK }
}
