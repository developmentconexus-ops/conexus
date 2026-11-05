import type { CompanyId, ProjectId } from '@conexus/hub-api'
import { cn } from '../../ui/cn.ts'
import { PageTitle } from '../../ui/list.tsx'
import { START_COLUMN } from '../conversation/public.ts'
import { Ask, Recent } from './home.tsx'

/**
 * **Conversas** of a Projeto (web W29, W34): the box that begins a conversation born in this Projeto,
 * with the bar of the connections released to it, and the person's conversations there. Every
 * member talks here (step 24.3.4).
 */
export function AssistantProject(props: {
  companyId: CompanyId
  projectId: ProjectId
  page: string | undefined
}) {
  const { companyId, projectId } = props
  return (
    <div className="mx-auto flex min-h-0 w-full max-w-page flex-1 flex-col gap-xl overflow-y-auto p-xl">
      <div className={cn(START_COLUMN, 'gap-xl')}>
        <PageTitle>Conversas</PageTitle>
        <Ask companyId={companyId} projectId={projectId} chooseProject={false} />
        <Recent companyId={companyId} projectId={projectId} page={props.page} param="page" />
      </div>
    </div>
  )
}
