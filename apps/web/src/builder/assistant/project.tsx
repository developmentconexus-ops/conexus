import type { CompanyId, ProjectId } from '@conexus/hub-api'
import { getRouteApi } from '@tanstack/react-router'
import { PageTitle } from '../../ui/list.tsx'
import { Ask, Recent } from './home.tsx'
import { MEMBERS_CANNOT } from './text.ts'

const company = getRouteApi('/_app/companies/$companyId')

/**
 * **Conversas** of a Projeto (web W29, W34): the box that begins a conversation born in this Projeto,
 * with the bar of the connections released to it, and the person's conversations there. A member
 * reads that only the owner and the administrators talk here; the Hub refuses them all the same.
 */
export function AssistantProject(props: {
  companyId: CompanyId
  projectId: ProjectId
  page: string | undefined
}) {
  const { companyId, projectId } = props
  const { role } = company.useRouteContext()
  return (
    <div className="mx-auto flex min-h-0 w-full max-w-page flex-1 flex-col gap-xl overflow-y-auto p-xl">
      <PageTitle>Conversas</PageTitle>
      {role === 'member' ? (
        <p className="text-text-2">{MEMBERS_CANNOT}</p>
      ) : (
        <>
          <Ask companyId={companyId} projectId={projectId} chooseProject={false} />
          <Recent companyId={companyId} projectId={projectId} page={props.page} param="page" />
        </>
      )}
    </div>
  )
}
