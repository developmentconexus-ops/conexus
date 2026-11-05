import { listAssistantConversations, ProjectId } from '@conexus/hub-api'

/** The places the filter names besides a Projeto. */
export type Place = 'HOME' | 'AUTOMATIONS' | ProjectId

/** What the address keeps of the company's list (web W18): the search, the place, the tab and the page. */
export type ListView = {
  q: string | undefined
  place: Place | undefined
  tab: 'PROJECTS' | undefined
  page: string | undefined
}

function textOf(value: unknown): string | undefined {
  return typeof value === 'string' && value !== '' ? value : undefined
}

function placeOf(value: unknown): Place | undefined {
  if (value === 'HOME' || value === 'AUTOMATIONS') return value
  const project = ProjectId.safeParse(value)
  return project.success ? project.data : undefined
}

const SearchText = listAssistantConversations.input.query.shape.q

/** The search text as the Hub reads it: trimmed, and nothing for a text the Hub would refuse. */
function searchOf(value: unknown): string | undefined {
  const text = SearchText.safeParse(value)
  return text.success ? text.data : undefined
}

/** The list's view as the address says it; a part the Hub would refuse is left out. */
export function viewOf(search: Record<string, unknown>): ListView {
  return {
    q: searchOf(search.q),
    place: placeOf(search.place),
    tab: search.tab === 'projects' ? 'PROJECTS' : undefined,
    page: textOf(search.conversations),
  }
}

/** The Hub's two ways to narrow a list: a Projeto by id, the other places by name. */
export function narrowedBy(place: Place | undefined): {
  projectId: ProjectId | undefined
  place: 'HOME' | 'AUTOMATIONS' | undefined
} {
  if (place === undefined) return { projectId: undefined, place: undefined }
  if (place === 'HOME') return { projectId: undefined, place: 'HOME' }
  if (place === 'AUTOMATIONS') return { projectId: undefined, place: 'AUTOMATIONS' }
  return { projectId: place, place: undefined }
}
