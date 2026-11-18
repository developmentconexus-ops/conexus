import type { CompanyId, PersonId, ProjectSummary } from '@conexus/hub-api'
import { ProjectId } from '@conexus/hub-api'
import { useQueries } from '@tanstack/react-query'
import { HubFailure } from '../../platform/hub.ts'
import type { RememberedList } from '../../platform/remembered.ts'
import { remember, useRecalled } from '../../platform/remembered.ts'
import { projectQuery } from './queries.ts'
import { PROJECT_FALLBACK } from './text.ts'

const SHOWN = 5

const lists = new Map<CompanyId, RememberedList<typeof ProjectId>>()

// One object for each company, so a render reading the list sees the same one every time.
function listOf(companyId: CompanyId): RememberedList<typeof ProjectId> {
  const known = lists.get(companyId)
  if (known !== undefined) return known
  const made = { name: `projects.${companyId}`, id: ProjectId, keep: SHOWN }
  lists.set(companyId, made)
  return made
}

export function rememberProject(input: {
  personId: PersonId
  companyId: CompanyId
  projectId: ProjectId
}): void {
  remember({ list: listOf(input.companyId), personId: input.personId, id: input.projectId })
}

/**
 * Up to five ids remembered in this browser, each with its name from the pages read or from
 * `projectQuery`; one the Hub no longer finds (`NOT_FOUND`) leaves, one still being read waits.
 * With `loaded` undefined the first page is still on its way, so nothing is read yet.
 */
export function useRecentProjects(
  companyId: CompanyId,
  personId: PersonId,
  loaded: readonly ProjectSummary[] | undefined,
): readonly { id: ProjectId; name: string }[] {
  const opened = useRecalled({ list: listOf(companyId), personId }).slice(0, SHOWN)
  const known = loaded ?? []
  const outside =
    loaded === undefined ? [] : opened.filter((id) => !known.some((project) => project.id === id))
  const reads = useQueries({ queries: outside.map((id) => projectQuery(companyId, id)) })
  return opened.flatMap((id) => {
    const listed = known.find((project) => project.id === id)
    if (listed !== undefined) return [{ id, name: listed.name }]
    const read = reads[outside.indexOf(id)]
    if (read === undefined || read.isPending) return []
    if (read.isSuccess) return [{ id, name: read.data.project.name }]
    return read.error instanceof HubFailure && read.error.code === 'NOT_FOUND'
      ? []
      : [{ id, name: PROJECT_FALLBACK }]
  })
}
